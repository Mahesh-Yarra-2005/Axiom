# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Android Device                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Expo (React Native)                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │  Screens │  │  Stores  │  │  Hooks   │  │  Libs  │  │  │
│  │  │(Expo     │  │(Zustand) │  │          │  │        │  │  │
│  │  │ Router)  │  │          │  │          │  │        │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │  │
│  │       │              │              │            │        │  │
│  │       └──────────────┴──────────────┴────────────┘        │  │
│  │                          │                                 │  │
│  │                ┌─────────┴─────────┐                       │  │
│  │                │   Supabase Client │                       │  │
│  │                └─────────┬─────────┘                       │  │
│  └──────────────────────────┼──────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │    Auth    │  │ PostgreSQL │  │   Edge Functions     │   │
│  │            │  │  (14 tables│  │                      │   │
│  │ Email/Pass │  │   + RLS)   │  │  /chat ──────────┐   │   │
│  │ Google     │  │            │  │  /summarize ─────┤   │   │
│  │            │  │            │  │  /search ────────┤   │   │
│  └────────────┘  └────────────┘  │  /study-plan ───┤   │   │
│                                   └─────────────────┼───┘   │
└─────────────────────────────────────────────────────┼───────┘
                                                      │ HTTPS
                                                      ▼
                              ┌────────────────────────────────┐
                              │        External APIs            │
                              │  ┌──────────┐  ┌────────────┐  │
                              │  │ Groq API │  │ YouTube    │  │
                              │  │ Llama 3.3│  │ Data API   │  │
                              │  │   70B    │  │ v3         │  │
                              │  └──────────┘  └────────────┘  │
                              └────────────────────────────────┘
```

## Data Flow

### AI Chat (Streaming)
```
User types message
  → chatStore.sendMessage()
    → streamEdgeFunction('chat', { messages })
      → Edge Function (Deno)
        → Groq API (SSE stream)
      ← SSE chunks forwarded
    ← ReadableStream parsed
  ← UI updates token-by-token
```

### Conversation Compaction
```
messages.length > 20?
  → Send old messages to Llama 3.1 8B
  ← Receive 200-word summary
  → Prepend summary as system message
  → Only keep last 5 messages + summary
```

### Study Plan Generation
```
Student uploads syllabus + selects exam + date
  → callEdgeFunction('generate-study-plan', {...})
    → Groq Llama 3.3 70B (JSON mode)
  ← Structured weekly plan
  → Save to study_plans table
  → Display timeline UI
```

### Video Summarization
```
Student selects YouTube video
  → callEdgeFunction('summarize-video', { video_id })
    → Fetch YouTube page HTML
    → Extract caption track URL
    → Download + parse captions
    → Send transcript to Groq
  ← Summary with timestamps, concepts, takeaways
```

## Database Schema

14 tables with Row Level Security:

| Table | Purpose | RLS |
|-------|---------|-----|
| users | Core profiles | Own data only |
| students | Student-specific data | Own data |
| parents | Parent-specific data | Own data |
| parent_student_links | Parent-child connections | Both parties |
| study_plans | AI-generated plans | Own data |
| study_goals | Exam targets | Own data |
| daily_progress | Daily tracking | Own data |
| conversations | Chat sessions | Own data |
| messages | Chat messages | Via conversation |
| notes | Study notes | Own data |
| video_watches | Video history | Own data |
| youtube_cache | API response cache | Service role |
| flashcards | Spaced repetition cards | Own data |
| mind_maps | Future feature | Own data |

## Security Model

- **API keys never touch the mobile app** — Edge Functions act as BFF proxy
- **Row Level Security** — Users can only access their own data
- **Parent access** — Through `parent_student_links` join table
- **Auth** — Supabase JWT with automatic refresh
- **CORS** — Configured for Supabase function domain only

## File Structure

```
src/
├── app/              # Screens (Expo Router file-based)
│   ├── (auth)/       # Login, signup, role select
│   ├── (student)/    # Student screens + tabs
│   └── (parent)/     # Parent screens + tabs
├── components/ui/    # Reusable UI components
├── stores/           # Zustand state management
├── hooks/            # Custom React hooks
├── lib/              # Supabase client, API helpers, SM-2
└── constants/        # Theme, prompts, Bloom's taxonomy
```
