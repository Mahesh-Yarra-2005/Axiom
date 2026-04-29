import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { content, subject, count = 5 } = await req.json();

    if (!content) {
      return errorResponse('content is required');
    }

    const prompt = `Generate ${count} flashcards from this study material. Return JSON: { "cards": [{ "front": "question", "back": "answer" }] }. Focus on key concepts, definitions, and important formulas.`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: content },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return errorResponse(`AI service error: ${response.status}`, 502);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(messageContent);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    return errorResponse('Internal server error', 500);
  }
});
