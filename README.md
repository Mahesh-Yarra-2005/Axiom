# Axiom — AI Study Companion

> Personalized AI-powered study assistant for JEE, NEET, CBSE, and college students.

---

## What is Axiom?

Axiom is a React Native (Expo) app that combines AI tutoring, spaced-repetition flashcards, syllabus-aware study planning, and a parent/teacher dashboard into one cohesive experience. Built for Indian students preparing for competitive exams.

---

## Features

### Student
- **AI Chat Tutor** — Powered by Groq (Llama 3.3 70B). Ask doubts, get explanations, save answers as notes
- **Bloom's Taxonomy Tagging** — Mark AI responses by cognitive level (Remember → Create). Long-press any AI message
- **Study Plan Generator** — Upload your syllabus or paste topics → AI generates a week-by-week plan with interactive checkboxes
- **Spaced Repetition Flashcards** — SM-2 algorithm for optimal review scheduling
- **Notes** — Create manually or export from chat. Subject/chapter tagged
- **Video Hub** — Search YouTube videos, AI summarizes with chapter timestamps
- **Goals Tracker** — Set exam target date + score, track weekly study hours with a bar chart
- **College Mode** — Full branch + year support (CSE, ECE, EE, Mech, Chem, Civil + 14 more)

### Parent
- **Dashboard** — See child's study hours, overall progress %, last active date
- **Multi-child support** — Link multiple children via invite code
- **Linking** — Enter child's 6-character invite code from their Profile

### Teacher
- **Class Management** — Share your 8-character teacher code with students
- **Student List** — See all linked students, weekly study hours, last active
- **Teacher Code** — Auto-generated, unique per teacher

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo Router |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| AI | Groq API (Llama 3.3 70B Versatile) |
| Auth | Supabase Auth |
| Storage | Supabase DB + AsyncStorage |

---

## Project Structure

```
projects/axiom/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, signup, role select
│   │   ├── (student)/       # Student screens + onboarding
│   │   ├── (parent)/        # Parent dashboard
│   │   └── (teacher)/       # Teacher dashboard
│   ├── stores/              # Zustand state (auth, chat, theme)
│   ├── hooks/               # useStreamingChat, useStudyTracker
│   ├── lib/                 # Supabase client, API helpers, spaced repetition
│   └── constants/           # Bloom's levels, AI prompts, theme
├── supabase/
│   ├── functions/           # Edge Functions (chat, study-plan, flashcards, videos)
│   └── migrations/          # DB schema + teachers migration
```

---

## Setup

### Prerequisites
- Node.js 18+
- Expo Go app on your phone

### 1. Clone & install
```bash
git clone https://github.com/Mahesh-Yarra-2005/Axiom.git
cd Axiom/projects/axiom
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
```
Fill in:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database
Run migrations in order via Supabase SQL Editor:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_demo_seed.sql`
- `supabase/migrations/003_teachers.sql`

### 4. Edge Functions
Deploy all 4 functions to your Supabase project and set the secret:
```
GROQ_API_KEY=your_groq_api_key
```
Functions: `chat`, `generate-study-plan`, `generate-flashcards`, `search-videos`, `summarize-video`

### 5. Run
```bash
npx expo start
```
Scan the QR code with Expo Go.

---

## Linking Flow

```
Student  →  Profile tab  →  "Link to Teacher"  →  Enter teacher code
Parent   →  Home tab     →  "Link Child"        →  Enter student invite code
Teacher  →  Students tab →  Share teacher code  →  Students enter it
```

---

## Roadmap

- [ ] Push notifications (daily study reminders, streak alerts)
- [ ] Weakness AI — auto-track topics where student consistently struggles
- [ ] Bloom's auto-tagging on all AI responses
- [ ] Teacher broadcast → auto-adjust linked students' study plans
- [ ] Exam simulation mode (NTA-style timed mock tests)
- [ ] Voice notes (speak doubt → AI answers → save as note)
- [ ] Offline mode (cached study plan + notes)
- [ ] Parent cognitive insights (not just time, but thinking level breakdown)

---

## License

MIT
