import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { query, subject } = await req.json();

    if (!query) {
      return errorResponse('query is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const cacheKey = `${query}|${subject || ''}`.toLowerCase();
    const { data: cached } = await supabase
      .from('youtube_cache')
      .select('data')
      .eq('query', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached?.data) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query
    const searchQuery = subject
      ? `${query} ${subject} education India`
      : `${query} education lecture`;

    const youtubeUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    youtubeUrl.searchParams.set('part', 'snippet');
    youtubeUrl.searchParams.set('q', searchQuery);
    youtubeUrl.searchParams.set('type', 'video');
    youtubeUrl.searchParams.set('maxResults', '10');
    youtubeUrl.searchParams.set('order', 'relevance');
    youtubeUrl.searchParams.set('videoDuration', 'medium');
    youtubeUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(youtubeUrl.toString());

    if (!response.ok) {
      const err = await response.text();
      console.error('YouTube API error:', err);

      // Return fallback mock data if API key isn't set up yet
      if (!YOUTUBE_API_KEY) {
        const fallbackData = generateFallbackResults(query);
        return new Response(JSON.stringify(fallbackData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return errorResponse(`YouTube API error: ${response.status}`, 502);
    }

    const data = await response.json();

    // Transform results
    const videos = (data.items || []).map((item: any) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      channel: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      published_at: item.snippet?.publishedAt,
    }));

    const result = { videos, query, total: videos.length };

    // Cache for 24 hours
    await supabase.from('youtube_cache').upsert({
      query: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'query' }).catch(() => {});

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search videos error:', error);
    return errorResponse('Internal server error', 500);
  }
});

function generateFallbackResults(query: string) {
  // Fallback mock data when YouTube API key isn't available
  const topics = [
    { channel: 'Physics Wallah', suffix: 'Complete Lecture' },
    { channel: 'Unacademy', suffix: 'One Shot' },
    { channel: 'Khan Academy', suffix: 'Explained Simply' },
    { channel: 'Vedantu', suffix: 'Full Chapter' },
    { channel: "BYJU'S", suffix: 'Visual Learning' },
  ];

  return {
    videos: topics.map((t, i) => ({
      id: `fallback_${i}`,
      title: `${query} — ${t.suffix}`,
      description: `Learn about ${query} in this comprehensive lecture.`,
      channel: t.channel,
      thumbnail: null,
      published_at: new Date().toISOString(),
    })),
    query,
    total: topics.length,
    is_fallback: true,
  };
}
