import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VIDEO_SUMMARIZER_PROMPT = `Summarize this educational video transcript. Structure your response as:

## Key Timestamps
(List timestamps with topic labels in format MM:SS - Topic)

## Main Concepts
(Bullet points of key concepts)

## Key Takeaways
(3-5 actionable takeaways for exam preparation)

## Formulas & Definitions
(Any important formulas or definitions mentioned)

Be concise and study-focused. Use LaTeX for math: $equation$.`;

// Try to fetch transcript from public service
async function getTranscript(videoId: string): Promise<string | null> {
  try {
    // Try youtubetranscript.com API (free, no key needed)
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Extract captions from page data
    const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
    if (!captionMatch) return null;

    const captionUrl = captionMatch[1].replace(/\\u0026/g, '&');
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) return null;

    const captionXml = await captionResponse.text();

    // Parse XML captions
    const textMatches = captionXml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
    const lines: string[] = [];
    for (const match of textMatches) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      lines.push(text);
    }

    return lines.join(' ') || null;
  } catch (error) {
    console.error('Transcript extraction error:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { video_id, video_title } = await req.json();

    if (!video_id) {
      return errorResponse('video_id is required');
    }

    // Try to get transcript
    let transcript = await getTranscript(video_id);

    let prompt: string;
    if (transcript) {
      // Truncate if too long (keep under 4000 tokens ~= 16000 chars)
      if (transcript.length > 16000) {
        transcript = transcript.slice(0, 16000) + '... [truncated]';
      }
      prompt = `Here is the transcript of the video "${video_title || 'Educational Video'}":\n\n${transcript}`;
    } else {
      // Fallback: generate summary based on title alone
      prompt = `The video "${video_title || video_id}" is an educational video. Based on the title, provide a likely summary of what this video covers, including expected key concepts, formulas, and takeaways. Note: actual transcript was unavailable.`;
    }

    // Call Groq for summary
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: VIDEO_SUMMARIZER_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return errorResponse(`AI service error: ${response.status}`, 502);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';

    return new Response(
      JSON.stringify({
        video_id,
        summary,
        has_transcript: !!transcript,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Summarize video error:', error);
    return errorResponse('Internal server error', 500);
  }
});
