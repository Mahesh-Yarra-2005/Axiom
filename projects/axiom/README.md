# Axiom - AI Study Assistant

![React Native](https://img.shields.io/badge/React_Native-0.83-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo_SDK-55-000020?logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036)
![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android)
![License](https://img.shields.io/badge/License-MIT-yellow)

> Notion + Google Classroom + NotebookLM + AI Tutor — in one app for Indian competitive exam students.

A comprehensive AI-powered study assistant for **JEE, NEET, and CBSE Board** students. Features streaming AI chat, personalized study plans, video summarization, spaced repetition flashcards, and parent progress tracking.

## Screenshots

| Dark Theme | Light Theme |
|:-:|:-:|
| AMOLED Gold (#D4AF37) | Cream & Soft Orange |

## Features

| Feature | Description |
|---------|-------------|
| AI Chat | Streaming tutor powered by Llama 3.3 70B with LaTeX support |
| Study Plans | AI-generated weekly plans from uploaded syllabus |
| Notes | Create, search, export from chat conversations |
| Video Hub | YouTube search + AI transcript summarization |
| Flashcards | SM-2 spaced repetition algorithm |
| Go Beyond | AI suggests deeper topics after each answer |
| Bloom's Taxonomy | Tag questions by cognitive level |
| Parent Dashboard | Monitor child's study hours and progress |
| Parent AI Advisor | Dedicated assistant for parents |
| Theme Support | AMOLED Dark Gold + Light mode |

## Architecture

```
Expo SDK 55 (React Native)
    │
    ├── Expo Router (file-based navigation)
    ├── Zustand (state management)
    └── expo-sqlite (offline cache)
         │
         ▼
Supabase Free Tier
    ├── Auth (email/password)
    ├── PostgreSQL (14 tables + RLS)
    └── Edge Functions (BFF proxy)
         ├── /chat → Groq Llama 3.3 70B (SSE streaming)
         ├── /summarize-video → transcript + AI summary
         ├── /search-videos → YouTube API + 24h cache
         └── /generate-study-plan → structured JSON output
```

## Quick Start

```bash
git clone https://github.com/Mahesh-Yarra-2005/Axiom.git
cd Axiom
npm install
cp .env.example .env
# Edit .env with your Supabase URL + key
npx expo start
```

See [docs/SETUP.md](docs/SETUP.md) for full setup instructions.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Expo SDK 55 + React Native 0.83 | Cross-platform mobile |
| Navigation | Expo Router | File-based routing |
| State | Zustand | Lightweight state management |
| Backend | Supabase | Auth, DB, Edge Functions |
| AI | Groq (Llama 3.3 70B) | Chat, summaries, plans |
| Video | YouTube Data API v3 | Video search |
| Offline | expo-sqlite + AsyncStorage | Local persistence |
| Charts | react-native-chart-kit | Progress visualization |

## Project Structure

```
src/
├── app/                    # 25+ screens (Expo Router)
│   ├── (auth)/             # Login, signup, role select
│   ├── (student)/          # Student tabs + features
│   │   ├── (tabs)/         # Home, Chat, Notes, Profile
│   │   ├── onboarding/     # Syllabus, exam, study plan
│   │   ├── chat/[id]       # AI conversation
│   │   ├── videos/         # YouTube hub + summaries
│   │   ├── flashcards/     # Decks + study sessions
│   │   └── goals/          # Progress tracking
│   └── (parent)/           # Parent tabs + child view
├── components/ui/          # 8 reusable components
├── stores/                 # Zustand stores (auth, chat, notes, theme)
├── hooks/                  # useStreamingChat
├── lib/                    # Supabase client, API helpers, SM-2
└── constants/              # Theme, prompts, Bloom's taxonomy
```

## Documentation

- [Setup Guide](docs/SETUP.md) — Step-by-step development setup
- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [Implementation Plan](docs/PLAN.md) — 7-day build schedule
- [About](docs/ABOUT.md) — Vision, philosophy, target users

## Build APK

```bash
npx eas build --platform android --profile preview
```

## Topics / Tags

`react-native` `expo` `supabase` `ai-tutor` `education` `jee` `neet` `cbse` `study-assistant` `groq` `llama` `spaced-repetition` `android` `typescript` `zustand`

## License

MIT
