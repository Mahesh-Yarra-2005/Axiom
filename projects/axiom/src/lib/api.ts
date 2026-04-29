import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'Content-Type': 'application/json',
  };
}

export async function callEdgeFunction(name: string, body: unknown) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Edge function ${name} failed: ${response.status}`);
  return response.json();
}

export interface StreamResult {
  fullText: string;
  bloomsLevel: string | null;
  bloomsReason: string | null;
}

export async function streamEdgeFunction(
  name: string,
  body: unknown,
  onChunk: (text: string) => void,
): Promise<StreamResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Edge function ${name} failed: ${response.status}`);
  if (!response.body) throw new Error('No response body for streaming');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let bloomsLevel: string | null = null;
  let bloomsReason: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    // Parse SSE data
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);

          // Handle Bloom's metadata event
          if (parsed.type === 'blooms_metadata') {
            bloomsLevel = parsed.level ?? null;
            bloomsReason = parsed.reason ?? null;
            continue;
          }

          // Handle normal SSE delta
          const content: string = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch { /* skip non-JSON lines */ }
      }
    }
  }

  return { fullText, bloomsLevel, bloomsReason };
}
