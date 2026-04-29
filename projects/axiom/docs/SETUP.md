# Setup Guide

## Prerequisites

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Expo Go app on Android ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Git

## Step 1: Clone and Install

```bash
git clone https://github.com/Mahesh-Yarra-2005/Axiom.git
cd Axiom
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier)
2. Choose a region close to you (Mumbai recommended for India)
3. Set a strong database password (save it!)
4. Wait for project to provision (~2 minutes)

## Step 3: Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. You should see "Success. No rows returned" — this is correct

## Step 4: Get Your Keys

From Supabase dashboard → **Settings → API**:
- Copy **Project URL** (looks like `https://abcdefgh.supabase.co`)
- Copy **anon/public key** (starts with `eyJ...`)

## Step 5: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## Step 6: Get Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Go to **API Keys** → Create new key
4. Copy the key (starts with `gsk_...`)

## Step 7: Deploy Edge Functions

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (find ref in Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set GROQ_API_KEY=gsk_your_key_here
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: YouTube API key for video search
supabase secrets set YOUTUBE_API_KEY=your_youtube_key

# Deploy all functions
supabase functions deploy chat
supabase functions deploy summarize-video
supabase functions deploy search-videos
supabase functions deploy generate-study-plan
```

## Step 8: Run the App

```bash
npx expo start
```

Scan the QR code with Expo Go on your Android device.

## Step 9: Build APK (When Ready)

```bash
# First time: create EAS account
npx eas login

# Build APK
npx eas build --platform android --profile preview
```

The APK will be available for download from the EAS dashboard (~10 min build time).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Network request failed" | Check .env has correct Supabase URL |
| Chat not working | Verify Groq API key is set as secret |
| Videos not loading | YouTube API key is optional; fallback data shows |
| Auth errors | Make sure anon key matches your project |
| Edge function 500 | Check `supabase functions logs <name>` |

## Optional: YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable **YouTube Data API v3**
4. Create credentials → API Key
5. Set as Supabase secret (see Step 7)

Without this key, the Video Hub shows fallback recommendations. The app still works.
