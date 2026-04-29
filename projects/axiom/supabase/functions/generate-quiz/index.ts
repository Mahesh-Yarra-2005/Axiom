import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const { topic, subject, count = 5, difficulty = 'medium', question_type = 'mcq', education_level = 'senior_secondary' } = await req.json();

    if (!topic) {
      return errorResponse('Topic is required');
    }

    const difficultyGuide = {
      easy: 'Focus on Remember and Understand levels of Bloom\'s taxonomy. Questions should test basic recall and comprehension.',
      medium: 'Mix of Understand, Apply, and Analyze levels. Questions should test conceptual understanding and application.',
      hard: 'Focus on Analyze, Evaluate, and Create levels. Questions should require deep thinking, multi-step reasoning, and synthesis.',
    };

    const educationGuide: Record<string, string> = {
      middle_school: 'Students aged 11-14 (grades 6-8). Use simple language, concrete examples.',
      secondary: 'Students aged 14-16 (grades 9-10). CBSE/ICSE board level. Moderate complexity.',
      senior_secondary: 'Students aged 16-18 (grades 11-12). JEE/NEET/Board exam level. High complexity, numerical problems.',
      undergraduate: 'College students. University-level depth and rigor.',
      postgraduate: 'Masters/PhD level. Advanced concepts, research-oriented.',
    };

    const systemPrompt = `You are an expert question paper setter for Indian education system exams (JEE, NEET, CBSE Board).
Generate ${count} ${question_type.toUpperCase()} questions on the topic: "${topic}" (Subject: ${subject}).

Education Level: ${educationGuide[education_level] || educationGuide.senior_secondary}
Difficulty: ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}

For each question, provide:
- A clear, unambiguous question text
- 4 options (for MCQ) with exactly one correct answer
- A brief explanation of the correct answer
- Bloom's taxonomy level (remember/understand/apply/analyze/evaluate/create)
- Difficulty rating (1-5)

IMPORTANT:
- Questions must be factually accurate
- Include numerical problems where applicable
- Vary the cognitive levels across questions
- Make distractors (wrong options) plausible but clearly incorrect
- For JEE/NEET style, include calculation-based questions

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question_text": "...",
      "question_type": "mcq",
      "options": [
        {"id": "a", "text": "...", "is_correct": false},
        {"id": "b", "text": "...", "is_correct": true},
        {"id": "c", "text": "...", "is_correct": false},
        {"id": "d", "text": "...", "is_correct": false}
      ],
      "correct_answer": "b",
      "explanation": "...",
      "marks": 1,
      "difficulty": 3,
      "blooms_level": "apply"
    }
  ]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} ${difficulty} difficulty questions on: ${topic}` },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);

    // Validate and clean questions
    const questions = (parsed.questions || []).map((q: any, i: number) => ({
      question_text: q.question_text || `Question ${i + 1}`,
      question_type: q.question_type || 'mcq',
      options: q.options || [],
      correct_answer: q.correct_answer || 'a',
      explanation: q.explanation || '',
      marks: q.marks || 1,
      difficulty: Math.min(5, Math.max(1, q.difficulty || 3)),
      blooms_level: q.blooms_level || 'understand',
      _ai_generated: true,
    }));

    return new Response(JSON.stringify({ questions, count: questions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    return errorResponse(err.message || 'Failed to generate quiz', 500);
  }
});
