# Axiom — Rork Prompt

> **Strategy note:** Rork works best with iterative prompts. Below is a **Phase 1 MVP prompt** to get the core app scaffolded, followed by **Phase 2-5 follow-up prompts** to layer features in subsequent iterations. Do NOT paste everything at once — Rork handles focused, specific prompts better than massive ones.

---

## PHASE 1 — Core App (Paste this FIRST)

```
Build a study assistant app called "Axiom" for Android. This is a productivity-first, polished, high-production study companion for high school and college students preparing for competitive exams (JEE, NEET, CBSE Board 12th). It should feel like a premium tool — calm, focused, and fast. No gamification, no XP, no badges. Think Notion meets an AI tutor.

TARGET USERS: Students (ages 15-22) preparing for STEM exams, and their parents who want to monitor progress.

DESIGN & THEME:
- AMOLED dark mode as default with gold accent color (#D4AF37 warm gold)
- Dark backgrounds should be true black (#000000) with gold highlights for buttons, icons, and active states
- Light mode option: paper white / off-white (#FAF9F6) background with pale cream (#FFFDD0), soft pinkish cream (#FFE4D6), and a subtle tint of light orange (#FFE0B2) as secondary surfaces
- Typography: clean sans-serif, highly readable. Use generous spacing
- Cards and surfaces should have subtle rounded corners and soft shadows
- Theme settings: Default Dark Gold, High Contrast, Monokai, Grayscale
- Smooth page transition animations between all screens
- Buttons should feel responsive when tapped with subtle haptic-style feedback animations
- This should feel alive, polished, and premium — not a hackathon prototype

TWO SEPARATE USER ROLES WITH DIFFERENT INTERFACES:

=== STUDENT INTERFACE ===

ONBOARDING FLOW:
1. Sign up with email/Google
2. Prompt: "Upload your syllabus" — accept PDF, TXT, DOCX, or image
3. Ask: "What exam are you preparing for?" (JEE / NEET / CBSE 12th / Custom)
4. Ask: "Tentative exam date?"
5. AI generates a personalized study plan/timeline based on syllabus + exam date
6. Home dashboard appears

STUDENT HOME DASHBOARD:
- Greeting with student name and motivational line
- Today's study plan card (subjects + chapters for today from the generated plan)
- Progress ring showing overall syllabus completion percentage
- Quick access tiles: "Chat with AI", "My Notes", "Video Hub", "My Stash", "Study Groups", "Social Feed"
- Streak counter (days studied, not gamified — just informational)
- Upcoming deadlines card (from study plan + teacher assignments)

SCREEN 1 — AI CHAT (Primary Feature):
- Full-screen chat interface, clean and minimal like ChatGPT
- Student types questions or doubts on any topic
- AI remembers context across sessions using conversation compaction (summarizes old messages, carries forward key context — no "fresh chat" mode)
- Memory management: Student can go to Profile > Learned Memory to view and delete specific memories the AI has stored
- Chat features:
  - "Export as Notes" button on any message — saves the AI response as a formatted note in My Notes
  - "Star" button on any message — saves to Star Questions collection
  - "Mark as HOTS" button — tags question with Bloom's Taxonomy level (Remember/Understand/Apply/Analyze/Evaluate/Create)
  - "Save to Mind Map" — extracts key concepts from the message and adds to the topic's mind map
- Doubt resolution flow: AI tries to answer → if student says "still unclear", AI tries different explanation → if still unclear, option appears: "Ask your teacher" (posts to teacher forum)
- "Go Beyond" mode: After answering a question, AI suggests 2-3 related deeper topics. Student can tap to explore further, creating a rabbit-hole learning experience
- At the bottom: text input with attach button (upload images of problems, PDFs, handwritten notes)

SCREEN 2 — MY NOTES:
- Grid/list view of all saved notes
- Notes are organized by subject > chapter
- Each note is rich text with headings, bullet points, math equations (LaTeX rendering), and highlighted text
- Sources: manually created, exported from AI chat, generated from video summaries
- Search across all notes
- Create new note manually with rich text editor

SCREEN 3 — VIDEO HUB:
- Search bar: type any topic (e.g., "Thermodynamics first law")
- Results: YouTube videos pulled for that topic, sorted by relevance
- "Peer picks" section: videos that students in your study group have watched for this topic are shown with priority (badge: "3 peers watched this")
- Tap a video: opens video player
- Below video: "Summarize" button → AI generates:
  - Key timestamps with topic labels
  - Bullet-point summary of the video
  - Key takeaways
  - "Generate Notes" button → converts summary into a formatted note saved to My Notes
- "Suggest related videos" at bottom

SCREEN 4 — MY STASH (Local Storage):
- File manager interface for all user-uploaded content
- Sections: PDFs, Documents, Images, Videos (if supported)
- Google Drive import: connect Google Drive, browse and import files into My Stash
- All files stored locally on device — accessible offline
- Tap any file to view/read it within the app
- Long press: options to send to AI chat for analysis, generate notes, create flashcards

SCREEN 5 — GOAL SETTING & PROGRESS:
- Set exam goals (exam name, date, target score/rank)
- AI breaks down the syllabus into weekly milestones
- Track daily/weekly progress
- Analytics: study hours per subject, chapters completed, quiz scores over time
- Visual charts (line graph for progress, pie chart for subject distribution)
- "On track" / "Behind" / "Ahead" indicator compared to the study plan

SCREEN 6 — FLASHCARDS & SPACED REPETITION:
- Create flashcards manually or auto-generate from notes/chat
- Organized by subject > chapter
- Spaced repetition algorithm: cards reappear at intervals (1 day → 3 days → 7 days → 14 days → 30 days) based on how well the student remembers
- Study session mode: swipe through cards, mark as "Got it" / "Review again"
- Stats: cards mastered, due today, total

SCREEN 7 — MIND MAPS:
- Auto-generated mind maps from AI conversations and notes for each topic
- Manual editing: add/remove/rearrange nodes
- Tap any node to see the related note or AI explanation
- Zoomable, pannable canvas
- Export as image

NAVIGATION:
- Bottom tab bar with 4 tabs: Home, Chat, Notes, Profile
- Other screens accessible from Home dashboard tiles or hamburger menu
- Smooth transitions, no jarring page loads

PROFILE & SETTINGS:
- Profile picture, name, exam info
- Learned Memory management (view/delete AI memories)
- Theme selector (Dark Gold / Light / High Contrast / Monokai / Grayscale)
- Google Drive connection
- Notification settings
- Study reminders
- Linked parent accounts
- API key input (labeled "Developer Options" — for power users to enter their own AI API key)

=== PARENT INTERFACE ===
(Separate sign-in flow — "I'm a Parent")

PARENT ONBOARDING:
1. Sign up
2. Link to child's account via invite code from the student
3. Can link multiple children

PARENT HOME DASHBOARD:
- Cards for each linked child showing:
  - Today's study summary (hours studied, topics covered)
  - Overall progress toward exam goal (percentage)
  - "On track" / "Behind" indicator
  - Last active time
- Tap a child card for detailed view

PARENT DETAILED VIEW:
- Progress charts: study hours per day (bar chart), syllabus completion (progress bar), quiz score trends (line graph)
- Chapters completed this week
- AI-generated weekly report summary
- NOT shown: chat history, specific questions asked (privacy)
- Exception: If AI detects psychological/mental health concerns in student's chat, parent gets a gentle alert: "Your child may be feeling stressed about [topic]. Consider checking in."

PARENT AI ASSISTANT:
- Chat interface for parents
- Can ask about child's academic progress and get AI-analyzed answers
- Can ask for study schedule suggestions for the child
- Can ask for general parenting advice: diet, sleep schedule, screen time, exam stress management
- Feels like a parent-teacher meeting — warm, reassuring, actionable
- The AI should be empathetic and suggest solutions, not just report data

Make all animations smooth and transitions polished. The app should feel alive, not static. Prioritize the best possible user experience. Keep the interface clean and uncluttered — this is a productivity tool, not a social media app.
```

---

## PHASE 2 — Teacher Interface & Classroom (Paste AFTER Phase 1 is stable)

```
Add a Teacher role to Axiom. Teachers sign up separately with "I'm a Teacher."

TEACHER ONBOARDING:
1. Sign up with email/Google
2. Enter: name, subject, institution
3. Option: "Connect Google Classroom" — syncs classes, student rosters, and assignments via Google Classroom API

TEACHER HOME DASHBOARD:
- My Classes list (created in-app or synced from Google Classroom)
- Create new class: class name, subject, invite code for students
- Announcements feed: post text announcements to a class
- Quick stats: number of students, average progress

TEACHER CLASS VIEW:
- Student roster with individual progress bars
- Post assignments with deadlines
- Create quizzes/tests:
  - Multiple choice, short answer, numerical
  - Set difficulty level per question (Bloom's Taxonomy)
  - Auto-grading for MCQ and numerical
  - Manual grading for short answer with AI-suggested scores
- View class analytics: average scores, topic-wise performance heatmap
- Material upload: upload PDFs, notes, videos that appear in students' feeds

STUDENT SIDE UPDATES:
- New tab in classes: "My Classes" showing enrolled classes
- See teacher announcements, assignments, deadlines
- Take quizzes within the app
- Download teacher-uploaded materials to My Stash

DOUBT FORUM:
- Within each class: a forum where students post doubts
- Flow: student asks doubt → AI answers first → if unsatisfied, doubt goes to teacher queue
- Teacher can answer with text, images, or voice notes
- Other students can upvote helpful answers
```

---

## PHASE 3 — Social & Peer Features (Paste AFTER Phase 2)

```
Add social and peer collaboration features to Axiom.

STUDY GROUPS (Telegram-style):
- Create or join study groups
- Group chat with text + multimedia sharing (images, PDFs, links, voice messages)
- Group Vault: shared file storage for the group (anyone can upload, everyone can access)
- Group activity: see which chapters group members have completed (with privacy toggle — students can opt out of sharing progress)

SOCIAL FEED (LinkedIn of studying):
- "Social" tab accessible from main navigation
- Students can post:
  - Text posts (study tips, motivation, questions)
  - External links (articles, resources)
  - Notes they've created (share to feed)
- Like and comment on posts
- Follow other students
- Feed algorithm: prioritize posts from study group members and same-exam peers
- No DMs — keep it focused on academics, not chat

PEER VIDEO PICKS:
- In Video Hub: "Peer Picks" section now shows videos watched by students in your study groups
- Badge showing "X peers found this helpful"
- Students can rate videos (helpful / not helpful) — ratings influence peer recommendations

Privacy controls in Settings:
- Toggle: "Share my chapter progress with study groups" (default: on)
- Toggle: "Show my activity on Social feed" (default: on)
- Students have full control over what peers can see
```

---

## PHASE 4 — Notebook-Style Content Viewer (Paste AFTER Phase 3)

```
Add a Notebook-style interactive content viewer to Axiom. When a student uploads material (PDF, document, or text) and asks the AI to "create a study notebook" from it, the AI generates a beautiful, interactive notebook-style view.

NOTEBOOK UI:
- Section-based layout with collapsible sections
- Rich content blocks:
  - Headings and subheadings with clear hierarchy
  - Formatted text with highlights and callout boxes
  - Math equations rendered beautifully (LaTeX)
  - Code blocks with syntax highlighting (for CS students)
  - Key terms highlighted with tap-to-define
  - "Key Concept" cards with gold accent borders
  - "Example" blocks with step-by-step solutions
  - "Quick Quiz" inline blocks — tap to reveal answer
  - Diagrams described as text with clean formatting (flowcharts as structured lists)
- Interactive elements:
  - Tap any section to ask AI "explain this more"
  - Highlight text to: save as flashcard / add to mind map / ask doubt
  - Checkbox: "I understand this" per section (tracks progress)
- The notebook should feel like reading a beautifully typeset textbook, not a raw document
- User-guided: student uploads material and tells AI what to generate (summarize chapter 3, make flashcards, explain concept X)

NOTEBOOK LIBRARY:
- All generated notebooks saved in a "Notebooks" section
- Organized by subject > chapter
- Offline accessible (stored locally)
```

---

## PHASE 5 — Monetization & Developer Options (Paste LAST)

```
Add a subscription/monetization layer to Axiom.

FREE TIER:
- Generous daily AI usage (set a reasonable message limit)
- All core features accessible
- Standard AI model

PREMIUM TIER:
- Extended context window (longer conversations before compaction)
- Access to a better/faster AI model
- Priority video summarization
- Unlimited flashcard generation
- Advanced analytics

DEVELOPER OPTION (in Profile > Developer Options):
- Input field for custom API key (OpenAI / Groq / Together AI)
- When API key is entered: bypasses built-in AI limits, uses student's own key
- Show usage stats for the custom API key
- Label this clearly as an advanced/professional option

IMPLEMENTATION:
- Use a simple flag/counter system for message limits
- Premium unlocks higher limits
- No ads anywhere in the app
- Subscription managed through in-app purchase or manual activation for now
```

---

## Quick Reference — Design Tokens for All Phases

```
COLORS:
- Primary Gold: #D4AF37
- Dark Background: #000000
- Dark Surface: #1A1A1A
- Dark Card: #242424
- Gold Muted: #B8942E
- Light Background: #FAF9F6
- Light Cream: #FFFDD0
- Light Pink Cream: #FFE4D6
- Light Orange Tint: #FFE0B2
- Text on Dark: #FFFFFF
- Text on Light: #1A1A1A
- Subtle Text: #9CA3AF
- Success: #4CAF50
- Warning: #FF9800
- Error: #EF4444

FONTS:
- Clean sans-serif (system default or Inter/Plus Jakarta Sans)
- Headings: Bold, generous size
- Body: Regular, comfortable line height (1.6)
- Monospace for code blocks

SPACING:
- Generous padding throughout
- Cards with 16px padding, 12px border radius
- Sections separated by clear whitespace

ANIMATIONS:
- Page transitions: smooth slide or fade (300ms ease)
- Button press: subtle scale-down (0.97) with spring back
- Card tap: gentle lift shadow animation
- List items: staggered fade-in on load
- Progress bars: animated fill on mount
```
