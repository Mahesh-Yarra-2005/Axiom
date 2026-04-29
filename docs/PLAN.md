# Axiom — Study Assistant Android App: Implementation Plan

## Context

Mahesh needs a study assistant Android app called **Axiom** for a college project. **Deadline: 1 week.** Graded on prototyping, innovation, and pitching. Must produce a working APK with core features demo-ready. Solo developer with some colleague assistance.

Axiom = Notion + Google Classroom + NotebookLM + AI Tutor — targeting JEE, NEET, CBSE Board students.

---

## Architecture

```
Expo SDK 55 (React Native 0.83) — Android APK via EAS Build
         │
         ├── Expo Router (file-based navigation)
         ├── Zustand (state management)
         ├── expo-sqlite (offline cache)
         └── AsyncStorage (preferences)
              │
              ▼
Supabase Free Tier
   ├── Auth (email/password + Google OAuth)
   ├── PostgreSQL (all tables + RLS)
   ├── Storage (syllabi, avatars)
   └── Edge Functions (Deno) — BFF proxy
        ├── /chat → Groq Llama 3.3 70B (streaming SSE)
        ├── /summarize-video → transcript + Groq summary
        ├── /search-videos → YouTube Data API v3
        └── /generate-study-plan → Groq structured output
```

**Why this stack:**
- Expo = fastest path to APK for solo dev
- Supabase free tier = auth + DB + storage + edge functions, zero cost
- Groq free tier = 30 RPM, 500K tokens/day — enough for demo
- Edge Functions as BFF = API keys never touch the mobile app

---

## Design System

| Token | Dark Gold (Default) | Light Mode |
|-------|-------------------|------------|
| Background | `#000000` | `#FAF9F6` |
| Surface | `#1A1A1A` | `#FFFDD0` |
| Card | `#242424` | `#FFE4D6` |
| Primary | `#D4AF37` (gold) | `#D4AF37` |
| Text | `#FFFFFF` | `#1A1A1A` |
| Subtle | `#9CA3AF` | `#6B7280` |

- Clean sans-serif (system font or Inter)
- 300ms ease transitions, button scale-down on press
- Ship Dark Gold + Light mode. Other themes (Monokai, Grayscale, High Contrast) only if time permits.

---

## MVP Feature Scope (What gets built)

| # | Feature | Priority | Day |
|---|---------|----------|-----|
| 1 | Auth + role selection (student/parent) | P0 | 1 |
| 2 | Student onboarding (syllabus upload → AI study plan) | P0 | 2 |
| 3 | Student home dashboard | P0 | 2 |
| 4 | AI chat with streaming + message actions | P0 | 3 |
| 5 | Notes system (create, view, export from chat) | P0 | 4 |
| 6 | Video Hub (YouTube search + play + AI summarize) | P1 | 4 |
| 7 | Parent dashboard + child linking | P1 | 5 |
| 8 | Parent AI assistant | P1 | 5 |
| 9 | Flashcards with spaced repetition (SM-2) | P2 | 6 |
| 10 | Goal tracking + progress charts | P1 | 2+5 |
| 11 | Theme switching (dark/light) | P2 | 6 |
| 12 | APK build + demo prep | P0 | 7 |

**Deferred to V2:** Teacher interface, Google Classroom sync, study groups, social feed, mind maps, My Stash file manager, notebook-style viewer, offline mode.

---

## Database Schema (Supabase PostgreSQL)

```sql
-- Core tables (Day 1)
users          (id uuid PK→auth.users, email, full_name, role, avatar_url, created_at)
students       (id serial PK, user_id FK→users, exam_type, target_date, syllabus_text, grade_level)
parents        (id serial PK, user_id FK→users)
parent_student_links (id, parent_id FK, student_id FK, invite_code varchar(6), created_at)

-- Study (Day 2)
study_plans    (id, student_id FK, title, subject, milestones jsonb, status, created_at)
study_goals    (id, student_id FK, exam_name, target_date, target_score, progress_pct)
daily_progress (id, student_id FK, date, study_minutes, chapters_covered jsonb, quiz_score)

-- Chat (Day 3)
conversations  (id, student_id FK, title, summary_text, created_at)
messages       (id, conversation_id FK, role text, content, is_starred bool, is_hots bool, blooms_level text, created_at)

-- Notes (Day 4)
notes          (id, student_id FK, title, content_json text, subject, chapter, source_type, tags text[], created_at)

-- Videos (Day 4)
video_watches  (id, student_id FK, youtube_video_id, title, summary text, timestamps_json, created_at)
youtube_cache  (id, query, data jsonb, expires_at timestamp)

-- Flashcards (Day 6)
flashcards     (id, student_id FK, subject, chapter, front, back, ease_factor float default 2.5, interval int default 1, repetitions int default 0, next_review timestamp, created_at)
```

RLS: Students access own data via `auth.uid() = user_id`. Parents access linked children via `parent_student_links` join.

---

## File Structure

```
axiom/
├── app.json / eas.json
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # Root: auth check + theme provider
│   │   ├── index.tsx                # Entry redirect
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   └── role-select.tsx
│   │   ├── (student)/
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx      # Bottom tabs: Home, Chat, Notes, Profile
│   │   │   │   ├── home.tsx
│   │   │   │   ├── chat.tsx         # Conversation list
│   │   │   │   ├── notes.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── syllabus.tsx
│   │   │   │   ├── exam-select.tsx
│   │   │   │   └── study-plan.tsx
│   │   │   ├── chat/[id].tsx        # Individual chat
│   │   │   ├── notes/[id].tsx       # Note detail
│   │   │   ├── notes/create.tsx
│   │   │   ├── videos/index.tsx     # Video Hub
│   │   │   ├── videos/[id].tsx      # Video + summary
│   │   │   ├── flashcards/index.tsx
│   │   │   ├── flashcards/study.tsx
│   │   │   └── goals/index.tsx
│   │   └── (parent)/
│   │       ├── (tabs)/
│   │       │   ├── _layout.tsx      # Tabs: Home, Chat, Profile
│   │       │   ├── home.tsx         # Dashboard with child cards
│   │       │   ├── chat.tsx         # Parent AI assistant
│   │       │   └── profile.tsx
│   │       └── child/[id].tsx       # Detailed child view
│   ├── components/
│   │   ├── ui/  (Button, Card, Input, ProgressRing, Modal)
│   │   ├── chat/ (ChatBubble, ChatInput, StreamingText, MessageActions)
│   │   ├── notes/ (NoteCard, NoteRenderer)
│   │   └── videos/ (VideoCard, VideoSummary)
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts                   # Edge function call helpers
│   │   ├── spaced-repetition.ts     # SM-2 algorithm
│   │   └── storage.ts              # expo-sqlite helpers
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── notesStore.ts
│   │   └── themeStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useStreamingChat.ts
│   └── constants/
│       ├── theme.ts                 # Color tokens, spacing, typography
│       ├── prompts.ts               # AI system prompts
│       └── blooms.ts                # Bloom's taxonomy levels
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── functions/
│       ├── chat/index.ts
│       ├── summarize-video/index.ts
│       ├── search-videos/index.ts
│       └── generate-study-plan/index.ts
└── assets/ (icon, splash, fonts)
```

---

## Day-by-Day Schedule

### Day 1: Foundation (8h)
- `npx create-expo-app axiom --template default@sdk-55`
- Install deps: `@supabase/supabase-js`, `zustand`, `expo-router`, `expo-sqlite`, `react-native-webview`, `react-native-reanimated`, `react-native-youtube-iframe`, `expo-document-picker`, `react-native-chart-kit`, `react-native-svg`
- Create Supabase project + run initial migration (users, students, parents, parent_student_links)
- Build auth screens (login, signup, role-select)
- Create `theme.ts` with all design tokens
- Build 5 core UI components (Button, Card, Input, ProgressRing, Modal)
- Set up Zustand stores (auth, theme)
- **Deliverable:** App boots, auth works, role selection works, themes applied

### Day 2: Onboarding + Dashboard (8h)
- Onboarding screens (syllabus upload via expo-document-picker, exam select, date picker)
- Deploy edge function: `generate-study-plan` (Groq proxy)
- AI generates study plan → save to DB → display as timeline
- Student home dashboard (today's focus card, progress ring, quick action tiles)
- Goal setting screen with basic charts
- Bottom tab navigation fully working
- **Deliverable:** Full onboarding → personalized dashboard with AI study plan

### Day 3: AI Chat (10h) — Most Critical Day
- Deploy edge function: `chat` with SSE streaming to Groq
- Build `useStreamingChat` hook (fetch + ReadableStream)
- Chat UI: conversation list, individual chat, streaming text, markdown rendering
- LaTeX: detect `$...$`, render via KaTeX in small WebView
- Message actions: star, HOTS tag (Bloom's level picker), export as note
- "Go Beyond" mode: parse suggestion chips from AI response, render as tappable pills
- Conversation compaction: summarize old messages when count > 20
- **Deliverable:** Fully working AI chat with streaming, actions, and Go Beyond

### Day 4: Notes + Videos (8h)
- Notes list (grid, search, filter by subject)
- Note detail renderer (markdown + LaTeX)
- Export-from-chat flow saves to notes table
- Manual note creation (markdown editor + preview)
- Deploy edge functions: `search-videos`, `summarize-video`
- Video Hub: search → YouTube results → play via react-native-youtube-iframe
- Video summarizer: extract transcript → AI summary → "Save as Notes" button
- **Deliverable:** Notes CRUD works, video search/play/summarize works

### Day 5: Parent Interface (7h)
- Parent auth + child linking (6-char invite code)
- Parent dashboard: child cards with progress %, study hours, last active
- Detailed child view: weekly bar chart, subject breakdown, chapters list
- Parent AI assistant: reuse chat infra with parent-specific system prompt
- Wire `daily_progress` tracking (increment study minutes during student sessions)
- **Deliverable:** Parent can link child, see dashboard, chat with AI advisor

### Day 6: Flashcards + Polish (8h)
- Flashcard CRUD (manual create + auto-generate from notes via Groq)
- SM-2 spaced repetition study session (Again/Hard/Good/Easy)
- Flashcard deck list (grouped by subject, due-today count)
- Animation polish: screen transitions, button feedback, chat message animations
- Loading states (skeleton screens, streaming cursor)
- Error handling (network errors, Groq rate limits, empty states)
- Theme toggle working (dark gold ↔ light)
- **Deliverable:** Flashcards with spaced repetition, polished UI throughout

### Day 7: Build + Test + Demo (8h)
- End-to-end testing (fresh signup → full flow for student and parent)
- Top bug fixes (crashes > broken flows > visual)
- Configure `eas.json` with `"buildType": "apk"`
- Run `eas build --platform android --profile preview`
- Install APK on physical device, smoke test
- Seed demo data (pre-filled student with chat history, notes, videos, progress)
- Prepare 3-min demo script

---

## Edge Function Details

### /chat (streaming)
- Auth: validate Supabase JWT
- Inject system prompt: "You are Axiom, an expert STEM tutor for JEE/NEET/CBSE..."
- If messages > 20: trigger compaction (Llama 3.1 8B summarizes old messages)
- Stream via Groq Llama 3.3 70B → SSE response
- Post-process: extract `[SUGGESTIONS]` for Go Beyond chips

### /summarize-video
- Receive YouTube video ID
- Fetch transcript from public transcript service
- Send to Groq with video summarizer prompt
- Return: `{ timestamps, summary, keyTakeaways }`

### /search-videos
- Proxy YouTube Data API v3 search
- Cache results in `youtube_cache` table for 24h (saves quota)
- Return top 10 results

### /generate-study-plan
- Receive syllabus text + exam type + target date
- Groq generates structured weekly plan
- Return JSON milestones

---

## Scope Cut Ladder (If Behind Schedule)

| Behind by | Cut | Absolute minimum demo |
|-----------|-----|-----------------------|
| 4h | Flashcards → simple flip cards (no SM-2) | |
| 8h | Video summarization (keep search+play), offline mode | |
| 12h | Video Hub entirely, theme switching | |
| 16h | Parent AI chat → static dashboard only | Auth → Chat → Notes → Parent dashboard |

---

## Dependencies to Install

```bash
# Core
npx expo install expo-router expo-sqlite @react-native-async-storage/async-storage react-native-webview react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens

# Backend
bun add @supabase/supabase-js zustand

# Features
bun add react-native-youtube-iframe react-native-chart-kit react-native-svg
npx expo install expo-document-picker expo-file-system

# Icons (included with Expo)
# @expo/vector-icons already bundled
```

---

## Verification Plan

1. **Auth:** Sign up student → select role → verify redirect to onboarding
2. **Onboarding:** Upload syllabus → select exam → verify AI study plan generated
3. **Chat:** Send 5+ messages → verify streaming works → star a message → export as note → verify note appears in Notes tab
4. **Go Beyond:** After AI response → verify suggestion chips appear → tap one → verify it sends as message
5. **Videos:** Search "thermodynamics" → verify YouTube results → play video → tap Summarize → verify summary appears → save as notes
6. **Parent:** Sign up as parent → enter child's invite code → verify dashboard shows child's data → chat with parent AI
7. **Flashcards:** Create deck → study session → rate cards → verify next review dates change
8. **Theme:** Toggle dark/light → verify all screens update
9. **APK:** Build → install on physical device → run full flow
10. **Demo:** Run through 3-min script with seeded data — no waiting for API responses
