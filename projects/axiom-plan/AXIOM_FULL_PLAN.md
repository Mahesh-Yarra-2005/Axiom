# AXIOM — Comprehensive Project Plan
### "Your Study Command Center"
**Version:** MVP (College Project)
**Deadline:** ~1 week
**Developer:** Solo + colleague assistance
**Evaluation:** Prototyping, Innovation, Pitching

---

## Table of Contents
1. [Product Vision](#1-product-vision)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Feature Breakdown](#4-feature-breakdown)
5. [Database Schema](#5-database-schema)
6. [Screen-by-Screen UI](#6-screen-by-screen-ui)
7. [API Design](#7-api-design)
8. [AI Integration](#8-ai-integration)
9. [Design System](#9-design-system)
10. [MVP vs Full Vision](#10-mvp-vs-full-vision)
11. [Day-by-Day Timeline](#11-day-by-day-timeline)
12. [Pitching Strategy](#12-pitching-strategy)

---

## 1. Product Vision

**Axiom** is an all-in-one study assistant that combines:
- **Notion** → Organized notes, notebooks, mind maps
- **Google Classroom** → Teacher-student connection, assignments
- **NotebookLM** → Upload material, AI generates interactive study content
- **AI Tutor** → Doubt clearing, concept exploration, personalized learning

**Target Users:**
- Higher secondary students (Class 11-12, CBSE boards)
- College students (STEM)
- Competitive exam aspirants (JEE, NEET)
- Parents (monitoring + guidance)
- Teachers (content publishing + classroom management)

**Core Philosophy:** Productive, not gamified. Clean, powerful, study-focused.

---

## 2. Tech Stack

All tools are **free / open-source**:

| Layer | Technology | Why |
|-------|-----------|-----|
| **Mobile App** | React Native + Expo (SDK 52+) | Fast dev, generates APK, huge ecosystem |
| **Navigation** | Expo Router (file-based) | Simple, modern, native feel |
| **UI Components** | React Native Paper + custom themed | Material Design 3, AMOLED-friendly |
| **State Management** | Zustand | Lightweight, simple, no boilerplate |
| **Local Storage** | SQLite (expo-sqlite) + AsyncStorage | Offline support for "My Stash" |
| **Backend** | Supabase (free tier) | Auth, PostgreSQL DB, Storage, Realtime |
| **Auth** | Supabase Auth (email + Google OAuth) | Free, supports multiple roles |
| **File Storage** | Supabase Storage (1GB free) + local SQLite | PDFs, images, notes stored locally too |
| **AI Model** | Groq API (free tier — Llama 3.3 70B) | Fast inference, generous free limits |
| **AI Fallback** | HuggingFace Inference API (free) | Backup if Groq rate-limited |
| **YouTube API** | YouTube Data API v3 (free 10k quota/day) | Video search + metadata |
| **Google Drive** | Google Drive API (free) | Import files to My Stash |
| **Google Classroom** | Google Classroom API (free) | Sync assignments + announcements |
| **Realtime Chat** | Supabase Realtime | Peer group chatrooms |
| **Push Notifications** | Expo Notifications (free) | Reminders, parent alerts |
| **Build** | EAS Build (free tier — 30 builds/month) | Generates .apk |

### Free Tier Limits (Important):
- **Supabase Free:** 500MB DB, 1GB storage, 2GB bandwidth, 50k auth users
- **Groq Free:** 30 req/min, 14,400 req/day (Llama 3.3 70B)
- **YouTube API:** 10,000 quota units/day (~100 searches)
- **Google Drive/Classroom:** Standard free quotas (more than enough)

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AXIOM MOBILE APP                  │
│                  (React Native + Expo)               │
├─────────────┬──────────────┬────────────────────────┤
│  Student UI │  Parent UI   │  Teacher UI            │
│  ─────────  │  ──────────  │  ──────────            │
│  Chat/Tutor │  Dashboard   │  Classroom Mgmt        │
│  Notes      │  AI Advisor  │  Content Upload        │
│  My Stash   │  Reports     │  Assignment Create     │
│  Flashcards │  Child Link  │  Student Progress      │
│  Mind Maps  │              │  Announcements         │
│  Videos     │              │                        │
│  Social     │              │                        │
│  Groups     │              │                        │
└──────┬──────┴──────┬───────┴────────────┬───────────┘
       │             │                    │
       ▼             ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              LOCAL LAYER (SQLite + AsyncStorage)      │
│  ─ My Stash (files cached locally)                   │
│  ─ Chat history (cached for offline reading)         │
│  ─ Created artifacts (notebooks, notes, mind maps)   │
│  ─ Flashcard decks + spaced repetition schedule      │
└──────────────────────┬───────────────────────────────┘
                       │ (when online)
                       ▼
┌──────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                   │
│  ┌──────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │   Auth   │ │ PostgreSQL│ │   Storage (files)   │ │
│  │  ──────  │ │  ────────  │ │  ──────────────    │ │
│  │ Student  │ │ Users     │ │ User uploads       │ │
│  │ Parent   │ │ Chats     │ │ Teacher materials  │ │
│  │ Teacher  │ │ Notes     │ │ Shared vault files │ │
│  │ Google   │ │ Groups    │ │                    │ │
│  │ OAuth    │ │ Progress  │ │                    │ │
│  └──────────┘ │ Syllabus  │ └─────────────────────┘ │
│               │ Flashcards│                          │
│               │ Reports   │  ┌─────────────────────┐ │
│               └───────────┘  │  Realtime (WS)      │ │
│                              │  ─ Group chats       │ │
│                              │  ─ Notifications     │ │
│                              └─────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ Groq API │ │ YouTube  │ │ Google APIs  │
    │ (AI/LLM) │ │ Data API │ │ Drive+Class  │
    └──────────┘ └──────────┘ └──────────────┘
```

### Data Flow — Key Flows:

**Student asks a doubt:**
```
Student types question
  → Check local chat cache
  → Send to Groq API (Llama 3.3 70B) with context (syllabus + topic)
  → Response streamed back to chat UI
  → Chat saved locally (SQLite) + synced to Supabase
  → If unresolved → Option to post to forum / teacher
```

**Video suggestion flow:**
```
Student selects a topic
  → YouTube API search (topic + "JEE/NEET/CBSE" + subject)
  → Check peer viewing data (what classmates watched for this topic)
  → Rank: peer-popular videos first, then by relevance
  → Display video cards with thumbnails
  → Student taps → Video plays (YouTube embed)
  → "Summarize" button → Sends transcript to AI → Notes generated
```

**Parent monitoring flow:**
```
Parent signs in → Linked to child account(s)
  → Dashboard shows: study hours, topics covered, test scores, goals
  → AI chat: "How is my child doing in Physics?"
  → AI analyzes child's data → Responds with insights + suggestions
  → Can suggest diet, sleep, schedule based on study patterns
  → Weekly auto-report via push notification
```

---

## 4. Feature Breakdown

### 4A. AI Chat / Tutor (MVP — MUST HAVE)

| Feature | Description |
|---------|-------------|
| **Chat Interface** | WhatsApp-style chat with the AI tutor |
| **Context Memory** | Uses compaction — summarizes old messages, keeps key facts |
| **LaTeX Rendering** | Math equations render beautifully (react-native-katex) |
| **Code Blocks** | Syntax highlighted code for CS topics |
| **Export as Notes** | Any chat message → save to My Notes |
| **Star Questions** | Bookmark important Q&A |
| **HOTS Tagging** | AI auto-tags questions by Bloom's level |
| **"Go Beyond"** | AI suggests deeper/related topics after answering |
| **Doubt Escalation** | AI can't solve? → Post to teacher/forum |

**Compaction Strategy:**
- After every 20 messages, AI summarizes the conversation into key points
- Summary stored as "learned memory" in user profile
- User can manually delete learned memories from Profile → Memory Manager
- New chats load the summary as system context (no fresh mode — always has memory)

### 4B. Notes Maker (MVP — MUST HAVE)

| Feature | Description |
|---------|-------------|
| **Notebook-style UI** | Rich text editor with sections, headings, bullet points |
| **Math Support** | Inline LaTeX for equations |
| **AI-Generated Notes** | Upload PDF/video → AI creates structured notes |
| **From Chat** | "Export as note" button on any chat message |
| **From Video Summary** | Video summarizer → auto-creates note |
| **Tags & Categories** | Organize by subject, chapter, exam type |
| **Search** | Full-text search across all notes |

### 4C. Video Suggester + Summarizer (MVP — MUST HAVE)

| Feature | Description |
|---------|-------------|
| **Topic-based Search** | Select subject + chapter → get YouTube recommendations |
| **Peer Priority** | Videos watched by your study group show first |
| **Video Player** | In-app YouTube embed (no leaving the app) |
| **Auto-Summarize** | Tap "Summarize" → AI extracts key points from transcript |
| **Timestamps** | AI-generated timestamps for key concepts |
| **Save as Note** | Summary → saved to Notes automatically |
| **Related Videos** | "Watch Next" suggestions within the topic |

### 4D. Goal Setting & Study Planner (MVP — MUST HAVE)

| Feature | Description |
|---------|-------------|
| **Syllabus Upload** | Upload syllabus PDF/text/image on signup |
| **Exam Date Input** | Set target exam dates |
| **AI Study Plan** | Auto-generate day-by-day study schedule |
| **Progress Tracking** | Mark chapters done, track % completion |
| **Daily Goals** | "Today's Tasks" dashboard widget |
| **Adjust Plan** | AI re-adjusts if student falls behind |
| **Stats** | Study hours, topics covered, streak (simple counter, not gamified) |

### 4E. Parent Interface (MVP — MUST HAVE)

| Feature | Description |
|---------|-------------|
| **Separate Login** | Parent role with its own home screen |
| **Multi-Child** | Link to multiple student accounts |
| **Dashboard** | Study time, topics, test scores, goal progress |
| **AI Advisor Chat** | Ask anything: "Is my child on track for NEET?" |
| **Health Suggestions** | AI suggests sleep, diet, breaks based on study patterns |
| **Psychological Flags** | If AI detects stress patterns → alert parent gently |
| **Weekly Reports** | Auto-generated progress summary |
| **Privacy Boundary** | NO access to chat history (except mental health flags) |

### 4F. My Stash (Local Storage)

| Feature | Description |
|---------|-------------|
| **Local Files** | All uploads stored on device (SQLite + file system) |
| **Google Drive Import** | One-way: pull files from Drive into Stash |
| **Drag & Drop** | Upload PDFs, images, docs, text files |
| **File Types** | PDF, TXT, DOC/DOCX, PPT, images (JPG/PNG), video (if feasible) |
| **Offline Access** | Everything in Stash works without internet |
| **Categories** | Organize by subject/folder |
| **Search** | Search file names and content |

### 4G. Mind Maps

| Feature | Description |
|---------|-------------|
| **Auto-Generated** | AI creates mind map from a topic/note |
| **Manual Edit** | Add/remove/rearrange nodes |
| **Interactive** | Tap a node → expand subtopic |
| **Export** | Save as image or PDF |
| **From Notes** | Generate mind map from existing notes |

### 4H. Flashcards + Spaced Repetition

| Feature | Description |
|---------|-------------|
| **AI-Generated** | From notes/chat → auto-create flashcards |
| **Manual Create** | Students make their own cards |
| **Spaced Repetition** | Algorithm schedules reviews (1d → 3d → 7d → 14d → 30d) |
| **Difficulty Rating** | After each card: Easy / Medium / Hard (affects schedule) |
| **Deck Organization** | By subject, chapter, exam |
| **Quiz Mode** | Timed flashcard quiz with scoring |

### 4I. Teacher / Classroom

| Feature | Description |
|---------|-------------|
| **Teacher Signup** | Separate role with classroom tools |
| **Create Classroom** | Invite students by code |
| **Google Classroom Sync** | Import assignments, announcements, roster |
| **Upload Material** | Share PDFs, notes, videos with students |
| **Create Quizzes** | Build quizzes, auto-graded by AI |
| **Assignments** | Set tasks with deadlines |
| **Student Progress** | View per-student performance |
| **Announcements** | Push notifications to all students |

### 4J. Social & Groups

| Feature | Description |
|---------|-------------|
| **Study Groups** | Create/join groups (Telegram-style) |
| **Group Chat** | Text + multimedia sharing (Supabase Realtime) |
| **Group Vault** | Shared file storage for the group |
| **Social Feed** | "LinkedIn of studying" — post text, links, resources |
| **Academic Progress** | Opt-in: share chapters completed with peers |
| **Privacy Controls** | Toggle what's visible to peers |

### 4K. Monetization

| Tier | Features |
|------|----------|
| **Free** | Full features, standard context window, base AI model |
| **Premium** | Larger context (longer conversations), better/faster model |
| **Developer** | Bring your own API key (Groq/OpenAI/Claude) |

*No ads. No profit motive. Education-first.*

---

## 5. Database Schema

### Supabase PostgreSQL Tables:

```sql
-- ============ USERS & AUTH ============

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  grade TEXT, -- '11', '12', 'college'
  exam_targets TEXT[], -- ['JEE', 'NEET', 'CBSE']
  subjects TEXT[], -- ['Physics', 'Chemistry', 'Math']
  syllabus_text TEXT, -- parsed syllabus content
  study_plan JSONB, -- AI-generated study plan
  daily_study_goal_minutes INT DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parent_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parent_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id),
  child_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE TABLE teacher_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  institution TEXT,
  subjects TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ AI CHAT ============

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  subject TEXT,
  topic TEXT,
  compacted_summary TEXT, -- compacted memory
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  is_hots BOOLEAN DEFAULT FALSE, -- Higher Order Thinking
  blooms_level TEXT, -- 'remember','understand','apply','analyze','evaluate','create'
  exported_as_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learned_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  memory_text TEXT NOT NULL,
  source_conversation_id UUID REFERENCES conversations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ NOTES & CONTENT ============

CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- rich text content blocks
  subject TEXT,
  chapter TEXT,
  tags TEXT[],
  source TEXT, -- 'manual', 'chat_export', 'video_summary', 'ai_generated'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  nodes JSONB NOT NULL, -- { id, label, x, y, parent_id, children[] }
  subject TEXT,
  source_notebook_id UUID REFERENCES notebooks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  subject TEXT,
  chapter TEXT,
  card_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL, -- question
  back TEXT NOT NULL, -- answer
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  next_review_at TIMESTAMPTZ,
  interval_days INT DEFAULT 1,
  ease_factor REAL DEFAULT 2.5,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ VIDEOS ============

CREATE TABLE video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  subject TEXT,
  topic TEXT,
  summary TEXT, -- AI-generated summary
  timestamps JSONB, -- [{time: "2:30", label: "Newton's 2nd law"}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE peer_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES study_groups(id),
  youtube_video_id TEXT NOT NULL,
  topic TEXT,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ GOALS & PROGRESS ============

CREATE TABLE study_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  target_date DATE,
  subject TEXT,
  chapters TEXT[],
  status TEXT DEFAULT 'active', -- active, completed, paused
  progress_pct REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject TEXT,
  topic TEXT,
  duration_minutes INT,
  activity TEXT, -- 'chat', 'notes', 'video', 'flashcards', 'quiz'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, subject, chapter)
);

-- ============ CLASSROOM ============

CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT,
  join_code TEXT UNIQUE,
  google_classroom_id TEXT, -- for sync
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classroom_members (
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (classroom_id, student_id)
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  attachments JSONB, -- [{url, filename, type}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES users(id),
  content TEXT,
  attachments JSONB,
  grade TEXT,
  ai_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SOCIAL & GROUPS ============

CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'pdf', 'video', 'link'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  links TEXT[],
  tags TEXT[],
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (post_id, user_id)
);

-- ============ PARENT MONITORING ============

CREATE TABLE parent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id),
  child_id UUID REFERENCES users(id),
  report_type TEXT, -- 'daily', 'weekly'
  data JSONB, -- {study_hours, topics, scores, ai_analysis}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FILES (My Stash metadata) ============

CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'image', 'doc', 'txt', 'ppt'
  file_size_bytes BIGINT,
  storage_path TEXT, -- Supabase storage path (for sync)
  local_path TEXT, -- local device path
  subject TEXT,
  tags TEXT[],
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Local SQLite Tables (on device):
```sql
-- Mirror of key cloud tables for offline access
-- Plus: cached chat messages, stash files, flashcard review queue
CREATE TABLE local_stash_files (
  id TEXT PRIMARY KEY,
  filename TEXT,
  file_type TEXT,
  local_uri TEXT, -- file:// path on device
  subject TEXT,
  tags TEXT,
  synced BOOLEAN DEFAULT 0,
  created_at TEXT
);

CREATE TABLE local_chat_cache (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  role TEXT,
  content TEXT,
  is_starred INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE local_flashcard_queue (
  card_id TEXT PRIMARY KEY,
  front TEXT,
  back TEXT,
  next_review_at TEXT,
  interval_days INTEGER,
  ease_factor REAL
);
```

---

## 6. Screen-by-Screen UI

### 6A. Onboarding Flow
```
[Splash Screen — AXIOM logo, gold on black]
        ↓
[Role Selection]
  ┌─────────────────────────┐
  │   I am a...             │
  │                         │
  │   [👨‍🎓 Student]          │
  │   [👨‍👩‍👧 Parent]           │
  │   [👨‍🏫 Teacher]           │
  │                         │
  └─────────────────────────┘
        ↓
[Sign Up — Email / Google OAuth]
        ↓ (if student)
[Syllabus Upload]
  ┌─────────────────────────┐
  │  Upload your syllabus   │
  │                         │
  │  [📄 Upload PDF/DOC]    │
  │  [📝 Paste Text]        │
  │  [📷 Take Photo]        │
  │                         │
  │  Exam targets:          │
  │  ☑ JEE  ☑ CBSE  ☐ NEET │
  │                         │
  │  Tentative exam date:   │
  │  [Date Picker]          │
  │                         │
  │  [Generate Study Plan →]│
  └─────────────────────────┘
        ↓
[AI generates personalized study plan]
        ↓
[Home Screen]
```

### 6B. Student Home Screen
```
┌──────────────────────────────────┐
│  AXIOM            ⚙️ 🔔 👤      │
├──────────────────────────────────┤
│                                  │
│  Good Morning, Mahesh            │
│  ──────────────────              │
│  Today's Goal: 3/5 chapters     │
│  ████████████░░░ 60%            │
│                                  │
│  📅 Study Plan                   │
│  ┌────────────────────────────┐  │
│  │ Physics: Thermodynamics    │  │
│  │ Chemistry: Organic Ch.3    │  │
│  │ Math: Integration          │  │
│  └────────────────────────────┘  │
│                                  │
│  ⏰ Next Review (Spaced Rep)     │
│  ┌────────────────────────────┐  │
│  │ 12 flashcards due today    │  │
│  │ [Review Now]               │  │
│  └────────────────────────────┘  │
│                                  │
│  📊 This Week                    │
│  Study: 14h 30m | Topics: 8     │
│  Quizzes: 85% avg               │
│                                  │
├──────────────────────────────────┤
│  💬    📝    🎥    📚    👥     │
│  Chat  Notes Video Stash Social │
└──────────────────────────────────┘
```

### 6C. AI Chat Screen
```
┌──────────────────────────────────┐
│  ← Physics Chat         ⋮       │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐    │
│  │ 🤖 Axiom AI              │    │
│  │                          │    │
│  │ In thermodynamics, the   │    │
│  │ first law states that    │    │
│  │ ΔU = Q - W               │    │
│  │                          │    │
│  │ where:                   │    │
│  │ • ΔU = internal energy   │    │
│  │ • Q = heat added         │    │
│  │ • W = work done          │    │
│  │                          │    │
│  │ [⭐ Star] [📝 Save Note] │    │
│  │ [🔍 Go Beyond]           │    │
│  │                          │    │
│  │ Bloom's: Understand 🟡   │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ You                      │    │
│  │ What about the second    │    │
│  │ law of thermodynamics?   │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────┐            │
│  │ 🤖 Typing...     │            │
│  └──────────────────┘            │
│                                  │
├──────────────────────────────────┤
│  [📎] [Type a message...]  [→]  │
│                                  │
│  Can't resolve? [Ask Teacher 👨‍🏫]│
└──────────────────────────────────┘
```

### 6D. Notes / Notebook Screen
```
┌──────────────────────────────────┐
│  ← My Notes            🔍 ➕    │
├──────────────────────────────────┤
│  [All] [Physics] [Chem] [Math]  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 📓 Thermodynamics Notes    │  │
│  │    From: Video Summary     │  │
│  │    Updated: 2h ago         │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 📓 Organic Chemistry Ch.3  │  │
│  │    From: Chat Export       │  │
│  │    Updated: Yesterday      │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 📓 Integration Formulas    │  │
│  │    From: Manual            │  │
│  │    Updated: 3 days ago     │  │
│  └────────────────────────────┘  │
│                                  │
│  [Create Note] [Generate from…] │
└──────────────────────────────────┘
```

### 6E. Notebook Editor (Opened Note)
```
┌──────────────────────────────────┐
│  ← Thermodynamics Notes    ⋮    │
├──────────────────────────────────┤
│                                  │
│  # Thermodynamics               │
│  ## First Law                    │
│                                  │
│  The first law of thermo-       │
│  dynamics states that energy     │
│  cannot be created or destroyed. │
│                                  │
│  **Key Equation:**               │
│  ΔU = Q - W                     │
│                                  │
│  ### Important Points            │
│  • System vs Surroundings        │
│  • Types of processes:           │
│    - Isothermal (const T)        │
│    - Adiabatic (Q = 0)          │
│    - Isobaric (const P)         │
│                                  │
│  ┌─── AI Suggestion ──────────┐  │
│  │ Generate flashcards from   │  │
│  │ this note? [Yes] [No]      │  │
│  └────────────────────────────┘  │
│                                  │
├──────────────────────────────────┤
│ [B] [I] [H] [•] [𝑓x] [🖼] [🔗]│
│ Bold Ital Head List Math Img Lnk│
└──────────────────────────────────┘
```

### 6F. Video Suggester Screen
```
┌──────────────────────────────────┐
│  ← Videos              🔍       │
├──────────────────────────────────┤
│  Topic: [Thermodynamics    ▼]   │
│                                  │
│  👥 Your peers watched:          │
│  ┌────────────────────────────┐  │
│  │ ▶ [thumbnail]              │  │
│  │   Thermodynamics in 30min  │  │
│  │   Physics Wallah • 2.1M    │  │
│  │   👥 5 classmates watched  │  │
│  │   [📝 Summarize]           │  │
│  └────────────────────────────┘  │
│                                  │
│  🔥 Recommended:                 │
│  ┌────────────────────────────┐  │
│  │ ▶ [thumbnail]              │  │
│  │   1st Law Deep Dive        │  │
│  │   Unacademy • 800K views   │  │
│  │   [📝 Summarize]           │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔗 Paste YouTube link:     │  │
│  │ [                        ] │  │
│  │ [Summarize This Video]     │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 6G. Parent Home Screen
```
┌──────────────────────────────────┐
│  AXIOM Parent        ⚙️ 🔔     │
├──────────────────────────────────┤
│                                  │
│  Your Children:                  │
│  ┌────────────────────────────┐  │
│  │ 👤 Mahesh                  │  │
│  │    Today: 2h 15m studied   │  │
│  │    Goal: 72% on track      │  │
│  │    Mood: 😊 Normal         │  │
│  │    [View Details →]        │  │
│  └────────────────────────────┘  │
│                                  │
│  📊 Weekly Summary               │
│  ┌────────────────────────────┐  │
│  │ Study Hours: ████░ 18/25h  │  │
│  │ Topics Done: 12/15         │  │
│  │ Quiz Avg: 78%              │  │
│  │ Consistency: ★★★★☆        │  │
│  └────────────────────────────┘  │
│                                  │
│  💬 Talk to AI Advisor            │
│  ┌────────────────────────────┐  │
│  │ "How should I help my      │  │
│  │  child prepare for JEE?"   │  │
│  │                            │  │
│  │ [Start Conversation →]     │  │
│  └────────────────────────────┘  │
│                                  │
│  🍎 Today's Suggestions          │
│  • Ensure 7h sleep tonight       │
│  • Light exercise before study   │
│  • Reduce screen time after 9pm  │
│                                  │
└──────────────────────────────────┘
```

### 6H. Teacher Dashboard
```
┌──────────────────────────────────┐
│  AXIOM Teacher       ⚙️ 🔔     │
├──────────────────────────────────┤
│                                  │
│  My Classrooms:                  │
│  ┌────────────────────────────┐  │
│  │ 📚 Physics 12A             │  │
│  │    32 students | Code: PH12│  │
│  │    [Open →]                │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 📚 JEE Physics Batch       │  │
│  │    18 students | Code: JP24│  │
│  │    [Open →]                │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ Create Classroom]            │
│  [🔗 Sync Google Classroom]      │
│                                  │
│  Recent Activity:                │
│  • 5 submissions pending review  │
│  • 3 doubt requests from forum   │
│  • Quiz "Thermo Ch1" - 78% avg  │
│                                  │
│  [📤 Upload Material]            │
│  [📝 Create Quiz]                │
│  [📢 Post Announcement]          │
│                                  │
└──────────────────────────────────┘
```

### 6I. Settings & Profile
```
┌──────────────────────────────────┐
│  ← Profile & Settings           │
├──────────────────────────────────┤
│                                  │
│  👤 Mahesh Yarra                 │
│     yerramahesh2005@gmail.com    │
│     [Edit Profile]               │
│                                  │
│  🧠 Memory Manager               │
│  ┌────────────────────────────┐  │
│  │ AI has learned 24 facts    │  │
│  │ about your study patterns  │  │
│  │ [Review & Delete →]        │  │
│  └────────────────────────────┘  │
│                                  │
│  🎨 Theme                        │
│  [● AMOLED Gold]                 │
│  [○ Light Cream]                 │
│  [○ High Contrast]               │
│  [○ Monokai]                     │
│  [○ Grayscale]                   │
│                                  │
│  🔗 Connected Services            │
│  Google Drive: ✅ Connected       │
│  Google Classroom: ❌ Not linked  │
│                                  │
│  👨‍👩‍👧 Parent Connection             │
│  Status: Linked to Mom's account │
│  Privacy: [Configure →]          │
│                                  │
│  🔑 API Key (Developer)          │
│  [Add your own API key]          │
│                                  │
│  💎 Subscription                  │
│  Free Plan | [Upgrade →]         │
│                                  │
│  📊 Storage                       │
│  My Stash: 234 MB / 1 GB        │
│                                  │
└──────────────────────────────────┘
```

---

## 7. API Design

### Supabase Edge Functions (serverless):

```
POST   /api/auth/signup              — Register user with role
POST   /api/auth/login               — Login
POST   /api/auth/google              — Google OAuth

GET    /api/chat/conversations       — List conversations
POST   /api/chat/conversations       — Create new conversation
GET    /api/chat/conversations/:id   — Get messages
POST   /api/chat/send                — Send message to AI
POST   /api/chat/compact             — Trigger compaction

GET    /api/notes                    — List notebooks
POST   /api/notes                    — Create notebook
PUT    /api/notes/:id                — Update notebook
POST   /api/notes/generate           — AI generates notes from content
POST   /api/notes/from-video         — Generate notes from video summary

GET    /api/videos/suggest           — Get video suggestions for topic
POST   /api/videos/summarize         — Summarize a YouTube video
GET    /api/videos/peer-watched      — Get peer viewing data

GET    /api/goals                    — Get study goals
POST   /api/goals                    — Create goal
PUT    /api/goals/:id                — Update progress
GET    /api/goals/study-plan         — Get AI study plan
POST   /api/goals/generate-plan      — Generate plan from syllabus

GET    /api/flashcards/decks         — List decks
POST   /api/flashcards/decks         — Create deck
GET    /api/flashcards/due           — Get due cards (spaced rep)
POST   /api/flashcards/review        — Submit review result
POST   /api/flashcards/generate      — AI generates from notes

GET    /api/mindmaps                 — List mind maps
POST   /api/mindmaps/generate        — AI generates from topic/notes
PUT    /api/mindmaps/:id             — Update mind map

GET    /api/classroom                — List classrooms
POST   /api/classroom                — Create classroom
POST   /api/classroom/join           — Join by code
POST   /api/classroom/sync-google    — Sync with Google Classroom
POST   /api/classroom/assignment     — Create assignment
POST   /api/classroom/quiz           — Create quiz

GET    /api/groups                   — List study groups
POST   /api/groups                   — Create group
GET    /api/groups/:id/messages      — Get messages (paginated)
POST   /api/groups/:id/messages      — Send message

GET    /api/parent/children          — Get linked children
GET    /api/parent/report/:childId   — Get child's progress report
POST   /api/parent/chat              — Parent AI advisor chat
POST   /api/parent/link              — Link to child account

GET    /api/social/feed              — Get social feed
POST   /api/social/post              — Create post
POST   /api/social/like/:postId      — Like a post

POST   /api/files/upload             — Upload file to Stash
GET    /api/files                    — List My Stash files
POST   /api/files/import-drive       — Import from Google Drive

GET    /api/progress/stats           — Study statistics
GET    /api/progress/sessions        — Session history

POST   /api/ai/explore               — "Go Beyond" — explore related topics
POST   /api/ai/assess                — Generate assessment quiz
POST   /api/ai/analyze-child         — Analyze child's data for parent
```

---

## 8. AI Integration

### AI System Prompts

**Student Tutor:**
```
You are Axiom, a study assistant for Indian students preparing for
JEE, NEET, and CBSE board exams. You explain concepts clearly with
examples. You use LaTeX for math. After answering, tag the question
with Bloom's taxonomy level. Offer to "Go Beyond" with related topics.
If the student is struggling, be encouraging but honest.
```

**Parent Advisor:**
```
You are Axiom's Parent Advisor. You have access to the child's study
data (hours, topics, scores, goals). Be empathetic and supportive.
Suggest actionable advice: study schedules, health tips (sleep, diet,
exercise), stress management. Flag potential burnout or mental health
concerns gently. Never share the child's chat history. Be like a
caring teacher in a parent-teacher meeting.
```

**Video Summarizer:**
```
Summarize this YouTube video transcript. Create:
1. Key timestamps with topic labels
2. Main concepts explained simply
3. Important formulas/facts highlighted
4. 5 quick revision points
Format for a student studying for [exam_type].
```

**Notes Generator:**
```
Create structured study notes from this content. Include:
- Clear headings and subheadings
- Key definitions in bold
- Formulas in LaTeX
- "Remember This" boxes for important facts
- 3 practice questions at the end
```

### AI Context Management (Compaction):
```
Every 20 messages:
1. Summarize conversation into key facts learned
2. Store summary in learned_memories table
3. On new conversation, load all learned memories as system context
4. User can view/delete memories from Profile → Memory Manager
```

---

## 9. Design System

### Color Palette — "AXIOM Gold"

**Dark Theme (AMOLED Gold) — Primary:**
```
Background:       #000000 (pure AMOLED black)
Surface:          #1A1A1A (cards, inputs)
Surface Elevated: #242424 (modals, dropdowns)
Primary Gold:     #D4A843 (buttons, accents, highlights)
Primary Light:    #E8C96A (hover states)
Primary Dark:     #B8912E (pressed states)
Text Primary:     #F5F0E6 (warm white)
Text Secondary:   #A39E93 (muted)
Border:           #333333
Success:          #4CAF50
Warning:          #FFB74D
Error:            #E57373
```

**Light Theme (Paper Cream) — Primary:**
```
Background:       #FAF8F5 (paper white / off-white)
Surface:          #FFFFFF (cards)
Surface Alt:      #FFF5E6 (pale yellow tint)
Cream:            #FFF8F0 (cream sections)
Pink Cream:       #FFF0EB (pinkish cream accents)
Light Orange:     #FFEBD6 (subtle orange tint)
Primary Gold:     #B8912E (darker gold for contrast on light bg)
Text Primary:     #2D2A26 (near-black, warm)
Text Secondary:   #6B6560
Border:           #E8E3DC
```

**Theme Variants:**
| Theme | Description |
|-------|-------------|
| AMOLED Gold | Black + gold. Default. Battery-friendly. |
| Paper Cream | Off-white, warm, easy on eyes. Daytime. |
| High Contrast | Black + bright gold + white. Accessibility. |
| Monokai | Dark with syntax-highlight-style colors. For CS students. |
| Grayscale | Pure B&W. Minimalist. Zero distraction. |

### Typography:
```
Headings:    Inter Bold (or system font bold)
Body:        Inter Regular
Code:        JetBrains Mono
Math:        KaTeX default
```

### Component Style:
- Rounded corners: 12px (cards), 8px (buttons), 20px (chips)
- Shadows: Subtle elevation on light theme, none on dark
- Animations: Subtle, fast (200ms). No bouncy/playful animations.
- Icons: Lucide icons (clean, consistent)
- Spacing: 8px grid system

---

## 10. MVP vs Full Vision

### What to build in 1 WEEK (MVP):

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | App shell + navigation + theming (AMOLED Gold + Light) | Must have |
| P0 | Auth (Student + Parent signup/login) | Must have |
| P0 | Student onboarding (syllabus upload + exam date → AI study plan) | Must have |
| P0 | AI Chat interface (with LaTeX, star, export, Bloom's tags) | Must have |
| P0 | Parent dashboard (child's stats + AI advisor chat) | Must have |
| P0 | Notes viewer/editor (basic rich text) | Must have |
| P1 | Video suggester (YouTube search by topic) | Should have |
| P1 | Video summarizer (paste link → AI summary) | Should have |
| P1 | Goal tracking (daily goals, progress bar) | Should have |
| P1 | My Stash (upload + view files locally) | Should have |
| P2 | Flashcards (basic create + review) | Nice to have |
| P2 | Mind maps (auto-generate from topic) | Nice to have |
| P2 | Parent-child linking | Nice to have |

### What to DEMO but not fully build:
- Google Classroom sync → Show UI, mock the sync
- Teacher dashboard → Show screens, basic functionality
- Group chatrooms → Show UI, basic messaging
- Social feed → Show UI design
- Spaced repetition → Show the algorithm working on flashcards

### POST-MVP (Future):
- Google Drive import
- Full teacher features + quiz engine
- Peer video recommendations
- Social feed with posts
- Forum / doubt escalation to teachers
- Mental health detection for parents
- Push notifications
- Monetization tiers
- API key settings

---

## 11. Day-by-Day Timeline

### Day 1: Foundation
```
Morning:
  ✅ Initialize Expo project (SDK 52+)
  ✅ Set up project structure (feature-based folders)
  ✅ Install core dependencies:
     - expo-router (navigation)
     - react-native-paper (UI)
     - @supabase/supabase-js
     - zustand (state)
     - expo-sqlite (local storage)
     - react-native-katex (math rendering)
  ✅ Configure Supabase project (free tier)
  ✅ Create database tables (run SQL above)
  ✅ Set up auth (Supabase Auth + Google OAuth)

Afternoon:
  ✅ Build Design System:
     - Theme provider (AMOLED Gold + Light Cream)
     - Common components (Button, Card, Input, Header)
     - Typography scale
     - Icon set (Lucide)
  ✅ Build Auth screens:
     - Role selection (Student / Parent / Teacher)
     - Sign up form
     - Login form
     - Google OAuth button

Evening:
  ✅ Build bottom tab navigation (Student)
  ✅ Build basic Home Screen layout (static data)
```

### Day 2: AI Chat (Core Feature)
```
Morning:
  ✅ Set up Groq API integration (Llama 3.3 70B)
  ✅ Build Chat screen UI:
     - Message bubbles (user + AI)
     - Text input with send button
     - Typing indicator
  ✅ Implement streaming response

Afternoon:
  ✅ Add LaTeX rendering in messages
  ✅ Add Star / Export as Note / Go Beyond buttons
  ✅ Implement Bloom's taxonomy auto-tagging
  ✅ Build conversation list screen
  ✅ Save chats to Supabase + local cache

Evening:
  ✅ Implement compaction (summarize after 20 messages)
  ✅ Implement memory storage + loading
  ✅ Test full chat flow end-to-end
```

### Day 3: Notes + Video Features
```
Morning:
  ✅ Build Notes list screen
  ✅ Build Notebook editor:
     - Rich text (headings, bold, italic, lists)
     - LaTeX inline support
     - Tags + subject categorization
  ✅ "Export from Chat" integration (chat → note)

Afternoon:
  ✅ Build Video Suggester screen:
     - Topic selector (subject → chapter)
     - YouTube API search integration
     - Video cards with thumbnails
  ✅ Build Video Summarizer:
     - Paste YouTube link → fetch transcript
     - Send to AI → get summary + timestamps
     - "Save as Note" from summary

Evening:
  ✅ AI Notes Generator:
     - Upload PDF/text → AI creates structured notes
  ✅ Test notes + video flow
```

### Day 4: Parent Interface + Goals
```
Morning:
  ✅ Build Parent auth flow (separate role)
  ✅ Build Parent home dashboard:
     - Child stats cards
     - Progress bars
     - Weekly summary
  ✅ Parent-child linking (invite code)

Afternoon:
  ✅ Parent AI Advisor chat:
     - Separate system prompt
     - Access to child's study data
     - Health + schedule suggestions
  ✅ Build study session tracking (auto-track time)
  ✅ Build progress reports

Evening:
  ✅ Build Goal Setting screen:
     - Syllabus upload on signup
     - AI generates study plan
     - Daily goals dashboard widget
  ✅ Chapter progress tracking
```

### Day 5: My Stash + Extra Features
```
Morning:
  ✅ Build My Stash screen:
     - File upload (document picker)
     - File list with categories
     - Local SQLite storage
     - File viewer (PDF, images, text)
  ✅ Offline mode (read stash + cached chats without internet)

Afternoon:
  ✅ Build Flashcards (basic):
     - Create deck + cards manually
     - AI generate from notes
     - Review mode with flip animation
     - Basic spaced repetition scheduling
  ✅ Build Mind Map (basic):
     - AI generates from topic
     - Simple tree visualization
     - Tap to expand

Evening:
  ✅ Build Settings/Profile screen:
     - Theme switcher (all 5 themes)
     - Memory Manager
     - Account info
  ✅ Polish navigation and transitions
```

### Day 6: Teacher UI + Social + Polish
```
Morning:
  ✅ Build Teacher dashboard (basic):
     - Classroom creation
     - Student list
     - Upload material
  ✅ Build Study Groups (basic):
     - Create/join group
     - Simple text chat (Supabase Realtime)
  ✅ Build Social feed UI (posts + likes)

Afternoon:
  ✅ Connect all features end-to-end
  ✅ Fix navigation edge cases
  ✅ Error handling + loading states
  ✅ Empty states (no notes yet, no chats yet, etc.)

Evening:
  ✅ Build APK using EAS Build
  ✅ Test on physical Android device
  ✅ Fix any device-specific bugs
```

### Day 7: Final Polish + Pitch Prep
```
Morning:
  ✅ Bug fixes from Day 6 testing
  ✅ Performance optimization
  ✅ Add splash screen + app icon
  ✅ Final APK build

Afternoon:
  ✅ Prepare pitch presentation:
     - Problem statement
     - Solution (Axiom)
     - Demo flow (scripted)
     - Tech architecture
     - Innovation highlights
     - Future roadmap

Evening:
  ✅ Practice demo
  ✅ Record backup demo video (in case of live demo issues)
  ✅ Final checks
```

---

## 12. Pitching Strategy

### Pitch Structure (5-7 minutes):

**1. The Problem (1 min):**
> "Students today juggle 5+ apps — YouTube for lectures, Notion for notes, WhatsApp for study groups, separate apps for flashcards, and parents have zero visibility. There's no single platform that connects the entire study ecosystem."

**2. The Solution — Axiom (1 min):**
> "Axiom is your study command center. One app that combines an AI tutor, smart notes, video learning, study planning, parent monitoring, and classroom management — all powered by AI, all in one place."

**3. Live Demo (3 min):**
- Student signs up → uploads syllabus → AI generates study plan
- Opens chat → asks a Physics doubt → shows LaTeX, Bloom's tag, "Go Beyond"
- Exports answer as note → shows in Notes
- Opens Video tab → searches topic → summarizes a video
- Switches to Parent view → shows dashboard → talks to AI advisor
- Shows AMOLED Gold theme + Light theme switch

**4. Innovation Highlights (1 min):**
- AI compaction (memory across sessions without infinite context)
- Bloom's taxonomy auto-tagging (metacognition awareness)
- Peer video priority (social learning signals)
- Parent AI advisor (not just dashboard — actual conversation)
- Offline-first architecture (study anywhere)

**5. Tech Stack + Architecture (30 sec):**
- React Native + Expo → Cross-platform
- Supabase → Scalable backend (free!)
- Groq + Llama 3.3 70B → Fast, free AI inference
- Offline-first with local SQLite

**6. Roadmap (30 sec):**
- V2: Google Classroom sync, teacher quizzes, spaced repetition
- V3: Peer study rooms, social feed, mental health detection
- Future: Multi-language support, voice assistant, AR study tools

---

## Folder Structure

```
axiom/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth group
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── role-select.tsx
│   ├── (student)/                # Student tab group
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── chat/
│   │   │   ├── index.tsx         # Conversation list
│   │   │   └── [id].tsx          # Chat screen
│   │   ├── notes/
│   │   │   ├── index.tsx         # Notes list
│   │   │   └── [id].tsx          # Note editor
│   │   ├── videos/
│   │   │   └── index.tsx         # Video suggester
│   │   ├── stash/
│   │   │   └── index.tsx         # My Stash
│   │   └── social/
│   │       └── index.tsx         # Social feed + groups
│   ├── (parent)/                 # Parent tab group
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Parent dashboard
│   │   ├── chat.tsx              # AI advisor
│   │   └── reports.tsx           # Child reports
│   ├── (teacher)/                # Teacher tab group
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Teacher dashboard
│   │   ├── classroom/
│   │   │   └── [id].tsx
│   │   └── create-quiz.tsx
│   ├── onboarding/
│   │   ├── syllabus.tsx
│   │   └── study-plan.tsx
│   ├── settings.tsx
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Header.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── VideoCard.tsx
│   │   ├── FlashCard.tsx
│   │   └── MindMapNode.tsx
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── BloomsBadge.tsx
│   ├── notes/
│   │   ├── NoteEditor.tsx
│   │   └── NoteCard.tsx
│   └── charts/
│       ├── ProgressBar.tsx
│       └── StudyChart.tsx
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── ai.ts                     # Groq/AI client
│   ├── youtube.ts                # YouTube API client
│   ├── storage.ts                # Local SQLite helpers
│   └── google.ts                 # Google Drive/Classroom
├── stores/
│   ├── authStore.ts              # Auth state (Zustand)
│   ├── chatStore.ts              # Chat state
│   ├── notesStore.ts             # Notes state
│   └── themeStore.ts             # Theme state
├── constants/
│   ├── themes.ts                 # All 5 theme definitions
│   ├── prompts.ts                # AI system prompts
│   └── subjects.ts               # Subject/chapter data
├── types/
│   └── index.ts                  # TypeScript types
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── fonts/
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── eas.json                      # EAS Build config
```

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Groq free tier rate limits | Implement request queuing + show "AI is busy" state |
| YouTube API quota exhaustion | Cache results locally, limit searches per session |
| 1-week deadline too tight | Focus on P0 features only, use mock data for demos |
| Supabase free tier storage | Primarily store files locally, Supabase for metadata |
| LaTeX rendering performance | Use lightweight katex renderer, lazy-load in long chats |
| Offline/online sync conflicts | Local-first: always write locally, sync when online |
| APK build failures | Test EAS Build early (Day 1), keep a dev build as backup |

---

## Summary

**Axiom** = Notion + Google Classroom + NotebookLM + AI Tutor, packaged as a clean, gold-themed Android app for Indian students.

**MVP (1 week):** AI chat tutor + notes maker + video suggester/summarizer + parent dashboard + goal setting + study planner. All working end-to-end with a polished AMOLED Gold theme.

**Innovation edge:** AI memory compaction, Bloom's auto-tagging, peer-powered video recommendations, parent AI advisor, offline-first architecture.

**The pitch writes itself:** "One app to replace five. Study smarter, not harder."

---

## 13. Research Papers & References

### Academic Papers (Cite in your presentation)

| Paper | Relevance to Axiom |
|-------|-------------------|
| [How Teachers Can Use LLMs and Bloom's Taxonomy to Create Educational Quizzes](https://arxiv.org/abs/2401.05914) (AAAI 2024) | Directly validates Axiom's Bloom's auto-tagging. LLMs generate quiz questions aligned to taxonomy levels — teachers prefer AI-generated quizzes with no quality loss vs handwritten. |
| [AIEd Bloom's Taxonomy: Enhancing AI in Education](https://staff.najah.edu/media/published_research/2024/05/07/watermarked_aied-bloom-s-taxonomy_apr-26-2024-18-49-35_1.pdf) (2024) | Proposes a new AI-education taxonomy (collect → adapt → simulate → process → evaluate → innovate). Axiom implements this progression through chat → notes → flashcards → assessment. |
| [Promoting Cognitive Skills in AI-Supported Learning Environments](https://www.tandfonline.com/doi/full/10.1080/03004279.2024.2332469) (2024) | Bloom's taxonomy + AI deepens cognitive thinking through questioning and reflection — exactly what Axiom's "Go Beyond" feature does. |
| [Cultivating Independent Thinkers: AI, Bloom's Taxonomy and Critical Thinking](https://link.springer.com/article/10.1007/s10639-025-13476-x) (2025) | Gen AI + Bloom's + critical thinking revolutionizes assessment pedagogy. Supports Axiom's HOTS tagging approach. |
| [Parent Monitoring System for Student Academic Performance](https://www.irjmets.com/uploadedfiles/paper//issue_4_april_2025/72392/final/fin_irjmets1744614247.pdf) (IRJMETS 2025) | Validates parent monitoring → improved academic outcomes. When parents actively participate, students show higher motivation and discipline. |
| [Mobile App for Self-Regulated Learning](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.793002/full) (Frontiers, 2022) | Mobile apps increase autonomous motivation and metacognitive self-regulation — backs Axiom's study planning + progress tracking. |
| [Parental Monitoring Apps and Autonomy](https://communityresearchinstitute.org/wp-content/uploads/2025/01/Parental-Monitoring-Apps-and-Autonomy-White-Paper.pdf) (2025 White Paper) | Balance between monitoring and privacy. Axiom addresses this by limiting parent access (no chat history, only stats + mental health flags). |
| [Harvard Study on AI Tutoring](https://etcjournal.com/2025/11/10/review-of-kestin-et-al-s-june-2025-harvard-study-on-ai-tutoring/) (Kestin et al., 2025) | Major Harvard study on AI tutoring effectiveness. Reference this for credibility on AI-powered doubt clearing. |
| [App-Based Self-Monitoring for Students with Learning Difficulties](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1270484/full) (Frontiers, 2024) | Self-monitoring interventions improve attention — supports Axiom's study session tracking and goal system. |

### Open Source GitHub Repos (Code Inspiration)

| Repository | Stars | What to Learn From It |
|-----------|-------|----------------------|
| [DeepTutor](https://github.com/HKUDS/DeepTutor) | Active | **Best reference.** 6 modes: Chat, Deep Solve, Quiz Gen, Deep Research, Math Animator, Visualize. Study their architecture for multi-mode AI tutoring. |
| [AI Study Assistant](https://github.com/mhss1/AIStudyAssistant) | — | Built with Jetpack Compose + Clean Architecture + MVVM. Study their Gemini integration, lecture summarizer, and question generator patterns. |
| [Mind Mentor](https://github.com/KartikLabhshetwar/mind-mentor) | — | AI-powered study assistant for exam prep. Good reference for study plan generation and concept explanation flows. |
| [Open Notebook](https://github.com/lfnovo/open-notebook) | Active | **NotebookLM alternative.** Supports 18+ AI providers, multi-modal content (PDFs, videos, audio), podcast generation. Study their document processing pipeline. |
| [Notex](https://github.com/smallnest/notex) | — | NotebookLM alternative with summaries, FAQs, study guides, quizzes from uploaded content. Study their transformation pipeline (content → quiz, content → summary). |
| [SurfSense](https://github.com/MODSetter/SurfSense) | Active | Connected to YouTube, GitHub, Notion, search engines. Study their YouTube integration and multi-source knowledge base approach. |
| [NotebookLLama](https://github.com/run-llama/notebookllama) | Active | LlamaCloud-backed NotebookLM alternative. Study their RAG pipeline for document Q&A — relevant for Axiom's "upload material → chat about it" feature. |
| [OpenBookLM](https://github.com/open-biz/OpenBookLM) | — | Uses WebAssembly to offload compute to client. Interesting approach for Axiom's offline capabilities. |
| [Study Buddy AI](https://github.com/almondkiruthu/study-buddy-AI) | — | University team project. Good reference for scope/architecture of a college-level study assistant project. |

### Key Takeaways for Axiom's Implementation:

1. **Bloom's Taxonomy AI tagging is validated** — Multiple 2024-2025 papers confirm LLMs can accurately classify questions by Bloom's level. Use the prompt engineering approach from the AAAI 2024 paper.

2. **Parent monitoring improves outcomes but needs privacy balance** — Research shows clear academic benefits, but Axiom's approach of stats-only (no chat snooping) aligns with best practices from the 2025 white paper.

3. **DeepTutor is the closest existing project** — Study its multi-mode architecture (Chat + Quiz + Solve + Research). Axiom extends this with notes, video, parent panel, and classroom features.

4. **Open Notebook / Notex for document processing** — Their pipelines for turning uploaded content into structured study material (summaries, quizzes, notes) are directly applicable to Axiom's NotebookLM-style feature.

5. **Harvard AI tutoring study (2025) is your strongest citation** — Use it in the pitch to establish credibility for AI-powered tutoring.

---

## 14. Pitch Slide Deck Outline

```
Slide 1:  AXIOM logo — "Your Study Command Center"
Slide 2:  The Problem — 5 apps, zero integration, parents in the dark
Slide 3:  The Solution — One app (show feature overview diagram)
Slide 4:  Research Backing — cite 3 papers (Bloom's, parent monitoring, AI tutoring)
Slide 5:  Live Demo — Student flow (signup → chat → notes → video)
Slide 6:  Live Demo — Parent flow (dashboard → AI advisor)
Slide 7:  Architecture Diagram — tech stack visual
Slide 8:  Innovation — 5 key innovations (Bloom's tagging, compaction, peer videos, parent AI, offline-first)
Slide 9:  Market & Competition — comparison table vs Notion/Classroom/NotebookLM
Slide 10: Roadmap — V1 → V2 → V3 with timelines
Slide 11: Thank You + Q&A
```

---

*Plan created for Axiom v0.1 MVP — Ready for development.*
