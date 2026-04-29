import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';
const SUPABASE_URL = 'https://noivtbpsxdeuqgtlbvqe.supabase.co';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BroadcastPayload {
  broadcast_id: number;
  teacher_id: number;
  supabase_token: string;
}

interface BroadcastRow {
  id: number;
  teacher_id: number;
  title: string;
  subject: string | null;
  chapter: string | null;
  event_date: string;
  event_type: string;
  description: string | null;
}

async function generateStudyTip(
  eventType: string,
  eventDate: string,
  subject: string | null,
  chapter: string | null
): Promise<string> {
  const subjectChapter = [subject, chapter].filter(Boolean).join(' ');
  const prompt = `A teacher created a ${eventType} on ${eventDate}${subjectChapter ? ' for ' + subjectChapter : ''}. Generate a 1-sentence study tip for this student to prepare. Be specific and actionable.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ??
    `Review ${subjectChapter || 'the relevant material'} thoroughly in the days before your ${eventType}.`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: BroadcastPayload = await req.json();
    const { broadcast_id, teacher_id } = body;

    if (!broadcast_id || !teacher_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: broadcast_id, teacher_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for all DB operations
    const headers = {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };

    // 1. Fetch broadcast details
    const broadcastRes = await fetch(
      `${SUPABASE_URL}/rest/v1/teacher_broadcasts?id=eq.${broadcast_id}&teacher_id=eq.${teacher_id}&select=*`,
      { headers }
    );

    if (!broadcastRes.ok) {
      throw new Error(`Failed to fetch broadcast: ${await broadcastRes.text()}`);
    }

    const broadcasts: BroadcastRow[] = await broadcastRes.json();
    if (!broadcasts || broadcasts.length === 0) {
      return new Response(JSON.stringify({ error: 'Broadcast not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const broadcast = broadcasts[0];

    // 2. Fetch linked student IDs for this teacher
    const linksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/teacher_student_links?teacher_id=eq.${teacher_id}&select=student_id`,
      { headers }
    );

    if (!linksRes.ok) {
      throw new Error(`Failed to fetch student links: ${await linksRes.text()}`);
    }

    const links: { student_id: number }[] = await linksRes.json();

    if (!links || links.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No linked students found',
        students_notified: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. For each student, generate adjustment note and collect inserts
    const adjustments: Array<{
      broadcast_id: number;
      student_id: number;
      adjustment_note: string;
      seen: boolean;
    }> = [];

    // Generate tips in parallel (up to 5 at a time to avoid rate limits)
    const BATCH_SIZE = 5;
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const batch = links.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (link) => {
          const tip = await generateStudyTip(
            broadcast.event_type,
            broadcast.event_date,
            broadcast.subject,
            broadcast.chapter
          );
          return {
            broadcast_id: broadcast.id,
            student_id: link.student_id,
            adjustment_note: tip,
            seen: false,
          };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          adjustments.push(result.value);
        } else {
          console.error('Failed to generate tip for student:', result.reason);
          // Still push with fallback message
          const failedLink = batch[batchResults.indexOf(result)];
          const subjectChapter = [broadcast.subject, broadcast.chapter].filter(Boolean).join(' ');
          adjustments.push({
            broadcast_id: broadcast.id,
            student_id: failedLink.student_id,
            adjustment_note: `Make sure to review ${subjectChapter || 'the material'} before the upcoming ${broadcast.event_type}.`,
            seen: false,
          });
        }
      }
    }

    // 4. Bulk insert into broadcast_adjustments (upsert to handle duplicates)
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/broadcast_adjustments`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=ignore-duplicates',
        },
        body: JSON.stringify(adjustments),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Failed to insert adjustments: ${errText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      broadcast_id: broadcast.id,
      students_notified: adjustments.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('process-broadcast error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
