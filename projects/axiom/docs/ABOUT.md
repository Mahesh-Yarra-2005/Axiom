# About Axiom

**Axiom** is a comprehensive AI-powered study assistant designed for Indian competitive exam students (JEE, NEET, CBSE Board).

## Vision

Combine the best of:
- **Notion** — Notes and organization
- **Google Classroom** — Structured learning
- **NotebookLM** — AI-powered understanding
- **AI Tutor** — Personalized teaching

Into one focused, distraction-free study companion.

## Target Users

### Students (Class 11-12)
- JEE Main / Advanced aspirants
- NEET aspirants
- CBSE Board exam students

### Parents
- Monitor child's study progress
- Get AI-powered guidance on supporting their child's preparation
- Weekly reports and insights

## Key Differentiators

1. **Indian Exam Focus** — Prompts, syllabi, and suggestions tailored to JEE/NEET/CBSE
2. **AI Tutor with Bloom's Taxonomy** — Questions tagged by cognitive level (Remember → Create)
3. **Go Beyond Mode** — AI suggests deeper exploration topics after each answer
4. **Conversation Compaction** — Long study sessions don't lose context
5. **Spaced Repetition** — SM-2 algorithm for optimal flashcard review scheduling
6. **Parent Dashboard** — Real-time visibility into study habits without being intrusive
7. **Zero Cost** — Built entirely on free-tier services (Supabase, Groq, YouTube API)

## Design Philosophy

- **AMOLED Dark Gold** — Premium feel, easy on eyes during long study sessions
- **No Gamification** — Focus on productivity, not dopamine hits
- **Minimal Distractions** — Every screen serves a study purpose
- **Offline-Ready** — Core features work without internet

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 55 (React Native) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI | Groq (Llama 3.3 70B) |
| Videos | YouTube Data API v3 |
| Offline | expo-sqlite + AsyncStorage |

## Project Context

Built as a college project demonstrating:
- Full-stack mobile development
- AI/LLM integration
- Multi-role architecture (student/parent)
- Production-quality UI/UX
- Backend-for-Frontend security pattern
