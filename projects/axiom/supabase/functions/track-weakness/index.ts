import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';
const SUPABASE_URL = 'https://noivtbpsxdeuqgtlbvqe.supabase.co';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages, student_id } = await req.json();
    if (!messages?.length || !student_id) {
      return new Response(JSON.stringify({ error: 'missing params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Take last 4 messages for context
    const recent = messages.slice(-4).map((m: any) => ({ role: m.role, content: m.content }));

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Analyze this study conversation and identify the specific topic being discussed. Return ONLY valid JSON: {"topic": "specific topic name e.g. Newton Laws of Motion", "subject": "Physics|Chemistry|Mathematics|Biology|Other"}' },
          ...recent,
        ],
        temperature: 0.1,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) throw new Error('Groq failed');
    const groqData = await groqRes.json();
    const parsed = JSON.parse(groqData.choices[0].message.content);
    const { topic, subject } = parsed;
    if (!topic) throw new Error('No topic extracted');

    // Upsert weakness
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: existing } = await supabase
      .from('weakness_tracking')
      .select('id, hit_count')
      .eq('student_id', student_id)
      .eq('topic', topic)
      .single();

    if (existing) {
      await supabase.from('weakness_tracking')
        .update({ hit_count: existing.hit_count + 1, last_seen: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('weakness_tracking')
        .insert({ student_id, topic, subject, hit_count: 1 });
    }

    return new Response(JSON.stringify({ topic, subject, tracked: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
