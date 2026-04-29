import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Knowledge Gap Detection — Analyzes student mastery and identifies prerequisite gaps
 *
 * Uses the knowledge graph to determine:
 * 1. Which concepts the student struggles with
 * 2. Which prerequisites are missing
 * 3. Recommended learning paths to fill gaps
 */

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { student_id, subject } = await req.json();

    if (!student_id) {
      return errorResponse('student_id is required');
    }

    // Get student's mastery data
    let masteryQuery = supabase
      .from('student_mastery')
      .select(`
        mastery_level,
        confidence,
        review_count,
        streak,
        node_id,
        knowledge_nodes (
          id, subject, chapter, topic, description,
          difficulty_level, blooms_level
        )
      `)
      .eq('student_id', student_id);

    if (subject) {
      masteryQuery = masteryQuery.eq('knowledge_nodes.subject', subject);
    }

    const { data: mastery } = await masteryQuery;

    // Get knowledge edges (prerequisites)
    const nodeIds = (mastery || []).map((m: any) => m.node_id);
    const { data: edges } = await supabase
      .from('knowledge_edges')
      .select('from_node_id, to_node_id, relationship, strength')
      .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`);

    // Get recent study events for pattern analysis
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: events } = await supabase
      .from('study_events')
      .select('event_type, node_id, score, metadata')
      .eq('student_id', student_id)
      .in('event_type', ['concept_struggled', 'concept_mastered', 'flashcard_reviewed', 'quiz_question_answered'])
      .gte('created_at', sevenDaysAgo);

    // === ANALYSIS ===

    // 1. Identify weak nodes (mastery < 0.4)
    const weakNodes = (mastery || [])
      .filter((m: any) => m.mastery_level < 0.4)
      .sort((a: any, b: any) => a.mastery_level - b.mastery_level);

    // 2. Identify missing prerequisites
    const masteryMap = new Map((mastery || []).map((m: any) => [m.node_id, m.mastery_level]));
    const missingPrereqs: any[] = [];

    for (const weakNode of weakNodes) {
      const prereqEdges = (edges || []).filter(
        (e: any) => e.to_node_id === weakNode.node_id && e.relationship === 'prerequisite'
      );

      for (const edge of prereqEdges) {
        const prereqMastery = masteryMap.get(edge.from_node_id) ?? 0;
        if (prereqMastery < 0.6) {
          missingPrereqs.push({
            struggling_topic: weakNode.knowledge_nodes?.topic,
            prerequisite_node_id: edge.from_node_id,
            prerequisite_mastery: prereqMastery,
            edge_strength: edge.strength,
          });
        }
      }
    }

    // 3. Struggle patterns (topics with repeated failures)
    const struggleCounts: Record<number, number> = {};
    for (const event of (events || [])) {
      if (event.event_type === 'concept_struggled' && event.node_id) {
        struggleCounts[event.node_id] = (struggleCounts[event.node_id] || 0) + 1;
      }
    }

    const chronicStruggles = Object.entries(struggleCounts)
      .filter(([_, count]) => count >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .map(([nodeId, count]) => {
        const m = (mastery || []).find((m: any) => m.node_id === parseInt(nodeId));
        return {
          node_id: parseInt(nodeId),
          topic: m?.knowledge_nodes?.topic || 'Unknown',
          subject: m?.knowledge_nodes?.subject,
          struggle_count: count,
          current_mastery: m?.mastery_level || 0,
        };
      });

    // 4. Generate AI recommendations if we have struggles
    let aiRecommendations = '';
    if (weakNodes.length > 0 || chronicStruggles.length > 0) {
      const weakTopics = weakNodes.slice(0, 5).map((w: any) =>
        `${w.knowledge_nodes?.topic} (${w.knowledge_nodes?.subject}, mastery: ${Math.round(w.mastery_level * 100)}%)`
      );
      const struggleTopics = chronicStruggles.slice(0, 3).map(s =>
        `${s.topic} (struggled ${s.struggle_count} times this week)`
      );

      const prompt = `A student is struggling with these topics:
Weak areas: ${weakTopics.join(', ')}
${struggleTopics.length > 0 ? `Chronic struggles: ${struggleTopics.join(', ')}` : ''}
${missingPrereqs.length > 0 ? `Missing prerequisites detected.` : ''}

Provide 3-5 brief, actionable study recommendations. Be specific about what to review and in what order. Keep response under 150 words.`;

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a study advisor. Give brief, actionable recommendations.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiRecommendations = data.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        // Non-critical — skip AI recommendations
      }
    }

    // 5. Recommended learning path
    const learningPath = weakNodes.slice(0, 10).map((w: any) => ({
      node_id: w.node_id,
      topic: w.knowledge_nodes?.topic,
      subject: w.knowledge_nodes?.subject,
      chapter: w.knowledge_nodes?.chapter,
      current_mastery: w.mastery_level,
      priority: w.mastery_level < 0.2 ? 'high' : w.mastery_level < 0.4 ? 'medium' : 'low',
      has_missing_prereqs: missingPrereqs.some((p: any) => p.struggling_topic === w.knowledge_nodes?.topic),
    }));

    return new Response(JSON.stringify({
      student_id,
      analysis: {
        total_concepts_tracked: (mastery || []).length,
        weak_concepts: weakNodes.length,
        chronic_struggles: chronicStruggles.length,
        missing_prerequisites: missingPrereqs.length,
      },
      weak_areas: weakNodes.slice(0, 10).map((w: any) => ({
        topic: w.knowledge_nodes?.topic,
        subject: w.knowledge_nodes?.subject,
        mastery: w.mastery_level,
        confidence: w.confidence,
      })),
      chronic_struggles: chronicStruggles,
      missing_prerequisites: missingPrereqs.slice(0, 10),
      recommended_path: learningPath,
      ai_recommendations: aiRecommendations,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Knowledge gap detection error:', err);
    return errorResponse(err.message || 'Analysis failed', 500);
  }
});
