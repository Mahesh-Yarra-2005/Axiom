import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const STUDY_PLAN_PROMPT = `You are an expert educational curriculum designer for Indian competitive exams (JEE, NEET, CBSE Board).

Given a syllabus and exam date, create a detailed weekly study plan. Return ONLY valid JSON in this exact format:

{
  "title": "Study Plan for [Exam Name]",
  "total_weeks": <number>,
  "weeks": [
    {
      "week": 1,
      "theme": "Foundation Building",
      "subjects": [
        {
          "name": "Physics",
          "chapters": ["Chapter Name 1", "Chapter Name 2"],
          "estimated_hours": 8,
          "priority": "high"
        }
      ],
      "goals": ["Complete X", "Practice Y problems"],
      "revision": false
    }
  ]
}

Rules:
- Prioritize high-weight topics first
- Reserve final 15-20% of time for revision
- Include practice problem goals each week
- Balance subjects across the plan
- Be specific with chapter names
- Allocate more hours to difficult/high-weight topics`;

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { syllabus_text, exam_type, target_date } = await req.json();

    if (!exam_type) {
      return errorResponse('exam_type is required');
    }

    // Calculate weeks until exam
    const examDate = target_date ? new Date(target_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const weeksUntilExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const userPrompt = `Create a ${weeksUntilExam}-week study plan for ${exam_type} exam.
${syllabus_text ? `\nSyllabus:\n${syllabus_text.slice(0, 8000)}` : `\nUse the standard ${exam_type} syllabus.`}
\nExam date: ${examDate.toLocaleDateString()}
Weeks available: ${weeksUntilExam}`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: STUDY_PLAN_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);

      // Return fallback plan if AI fails
      return new Response(JSON.stringify(generateFallbackPlan(exam_type, weeksUntilExam)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      // If JSON parsing fails, return fallback
      plan = generateFallbackPlan(exam_type, weeksUntilExam);
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate study plan error:', error);
    return errorResponse('Internal server error', 500);
  }
});

function generateFallbackPlan(examType: string, weeks: number) {
  const subjects: Record<string, string[][]> = {
    'JEE': [
      [['Mechanics', 'Kinematics', 'Laws of Motion'], ['Sets, Relations & Functions', 'Trigonometry'], ['Atomic Structure', 'Periodic Table']],
      [['Work, Energy, Power', 'Rotational Motion'], ['Calculus — Limits & Derivatives'], ['Chemical Bonding', 'States of Matter']],
      [['Gravitation', 'Fluid Mechanics'], ['Coordinate Geometry'], ['Thermodynamics', 'Equilibrium']],
      [['Thermodynamics', 'Kinetic Theory'], ['Sequences & Series', 'Binomial Theorem'], ['Organic Chemistry — Basics']],
      [['Electrostatics', 'Current Electricity'], ['Matrices & Determinants'], ['Hydrocarbons', 'Polymers']],
      [['Revision & Practice'], ['Revision & Practice'], ['Revision & Practice']],
    ],
    'NEET': [
      [['Mechanics'], ['Cell Biology', 'Biomolecules'], ['Atomic Structure']],
      [['Thermodynamics'], ['Plant Physiology'], ['Chemical Bonding']],
      [['Optics'], ['Human Physiology'], ['Organic Chemistry']],
      [['Modern Physics'], ['Genetics & Evolution'], ['Equilibrium']],
      [['Revision'], ['Ecology & Environment'], ['Revision']],
    ],
  };

  const plan = subjects[examType] || subjects['JEE'];
  const subjectNames = examType === 'NEET'
    ? ['Physics', 'Biology', 'Chemistry']
    : ['Physics', 'Mathematics', 'Chemistry'];

  return {
    title: `Study Plan for ${examType}`,
    total_weeks: Math.min(weeks, plan.length),
    weeks: plan.slice(0, weeks).map((weekData, i) => ({
      week: i + 1,
      theme: i === plan.length - 1 ? 'Revision & Mock Tests' : `Week ${i + 1} Focus`,
      subjects: subjectNames.map((name, j) => ({
        name,
        chapters: weekData[j] || ['Review & Practice'],
        estimated_hours: 8,
        priority: i < 3 ? 'high' : 'medium',
      })),
      goals: [`Complete Week ${i + 1} chapters`, `Solve 20+ practice problems`],
      revision: i >= plan.length - 2,
    })),
    is_fallback: true,
  };
}
