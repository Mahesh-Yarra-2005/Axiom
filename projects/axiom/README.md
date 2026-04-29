# Axiom - AI Study Assistant

A comprehensive study assistant app for JEE, NEET, and CBSE Board students. Built with Expo (React Native), Supabase, and Groq AI.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your Supabase URL and anon key.

### 4. Get API Keys
- **Groq** (required for AI chat): [console.groq.com](https://console.groq.com) - Create API key (free)
- **YouTube Data API** (optional): [Google Cloud Console](https://console.cloud.google.com) - Enable YouTube Data API v3

### 5. Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set GROQ_API_KEY=your-key
supabase secrets set YOUTUBE_API_KEY=your-key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy all functions
supabase functions deploy chat
supabase functions deploy summarize-video
supabase functions deploy search-videos
supabase functions deploy generate-study-plan
```

### 6. Run the App
```bash
npx expo start
```
Scan the QR code with Expo Go on your Android device.

### 7. Build APK
```bash
npx eas build --platform android --profile preview
```

## Tech Stack
- **Frontend:** Expo SDK 55, React Native, Expo Router, Zustand
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **AI:** Groq (Llama 3.3 70B) for chat, study plans, video summaries
- **Video:** YouTube Data API v3

## Features
- AI-powered STEM tutor with streaming chat
- Personalized study plan generation
- Notes system with export from chat
- YouTube video search and AI summarization
- Flashcards with SM-2 spaced repetition
- Parent dashboard with child progress tracking
- Dark/Light theme support
