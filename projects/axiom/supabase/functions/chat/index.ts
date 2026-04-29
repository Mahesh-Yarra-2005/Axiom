import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Axiom, an expert STEM tutor specializing in JEE, NEET, and CBSE Board exams. You explain concepts clearly with examples and analogies. Use LaTeX for math: $equation$. Be concise and focused.

After each answer, suggest 2-3 related topics for deeper exploration. Format them as:
[SUGGESTIONS]: 1. First related topic 2. Second related topic 3. Third related topic`;

const COMPACTION_PROMPT = `Summarize this conversation, preserving: key concepts discussed, student's understanding level, unresolved doubts, important formulas/definitions. Be concise (200 words max).`;

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { messages, conversation_id, system_prompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return errorResponse('messages array is required');
    }

    // Build message array with system prompt
    const systemPrompt = system_prompt || SYSTEM_PROMPT;
    let chatMessages = [
      { role: 'system', content: systemPrompt },
    ];

    // Check if compaction is needed (> 20 messages)
    if (messages.length > 20) {
      // Take first 15 messages for compaction
      const oldMessages = messages.slice(0, messages.length - 5);
      const recentMessages = messages.slice(messages.length - 5);

      // Compact old messages using a fast model
      const compactionResponse = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: COMPACTION_PROMPT },
            ...oldMessages,
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (compactionResponse.ok) {
        const compactionData = await compactionResponse.json();
        const summary = compactionData.choices?.[0]?.message?.content || '';
        chatMessages.push({
          role: 'system',
          content: `Previous conversation summary: ${summary}`,
        });
      }

      chatMessages.push(...recentMessages);
    } else {
      chatMessages.push(...messages);
    }

    // Stream response from Groq
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return errorResponse(`AI service error: ${response.status}`, 502);
    }

    // Create a TransformStream to intercept the Groq stream, accumulate full text,
    // then append Bloom's classification before finishing.
    const encoder = new TextEncoder();
    let fullText = '';

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    // Process the stream in the background
    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Accumulate text content for classification
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) fullText += content;
              } catch { /* skip non-JSON lines */ }
            }
          }

          // Forward the original chunk as-is to client
          await writer.write(value);
        }

        // After all streaming chunks are sent, classify Bloom's level
        try {
          const classifyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: `Classify this AI tutor response into ONE Bloom's Taxonomy level.
Return ONLY JSON: {"level": "Remember|Understand|Apply|Analyze|Evaluate|Create", "reason": "one sentence"}
- Remember: recalling facts, definitions, formulas
- Understand: explaining, summarizing, interpreting
- Apply: solving problems, using formulas
- Analyze: comparing, breaking down, finding patterns
- Evaluate: justifying, critiquing, assessing
- Create: designing, proposing, combining ideas`,
                },
                { role: 'user', content: `Classify this response:\n\n${fullText.slice(0, 1000)}` },
              ],
              temperature: 0.1,
              max_tokens: 80,
              response_format: { type: 'json_object' },
            }),
          });

          if (classifyRes.ok) {
            const classifyData = await classifyRes.json();
            const classified = JSON.parse(classifyData.choices[0].message.content);
            // Emit special metadata SSE event
            await writer.write(
              encoder.encode(
                `data: {"type":"blooms_metadata","level":"${classified.level}","reason":"${(classified.reason || '').replace(/"/g, '')}"}\n\n`,
              ),
            );
          }
        } catch (classifyErr) {
          console.error('Bloom classification error (non-fatal):', classifyErr);
        }

        // Emit [DONE] terminator
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (streamErr) {
        console.error('Stream processing error:', streamErr);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return errorResponse('Internal server error', 500);
  }
});
