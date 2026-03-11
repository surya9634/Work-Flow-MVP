# Sales OS — AI-Powered Sales Automation Platform

## What We're Building

A SaaS platform where a business owner completes a one-time AI-guided setup,
and their own AI voice agent is automatically generated to make and receive
real sales calls — 24/7, no human needed.

---

## The Big Idea

Most small businesses can't afford a sales team. Sales OS gives them an AI
sales agent that sounds like a real person, handles objections, books meetings,
and logs every call — all from a single dashboard.

---

## Core Users

- Small business owners (coaches, agencies, SaaS founders)
- Sales managers who want to automate outreach at scale
- Anyone who generates leads but doesn't have time to call them all

---

## Product Flow (End-to-End)

### Step 1 — Sign Up
User creates an account (email + password).
Lands directly on the Onboarding Chat.

### Step 2 — AI Interview (Onboarding)
A conversational AI (Groq LLM) interviews the user over ~5 minutes:
  - What's your business name?
  - What industry are you in?
  - Describe your product/service
  - What's your sales goal? (book demos, sell courses, generate leads)
  - Who is your ideal customer?
  - What objections do they usually raise?
  - What tone/voice should the agent have?

Result: The AI auto-generates a fully configured sales agent with:
  - A custom system prompt (the agent's "brain")
  - An opening script (how it greets leads)
  - A conversation tree (how it handles objections + pivots)
  - A voice profile (gender, tone, accent)

### Step 3 — Create a Campaign
  - Name the campaign (e.g. "February Outreach")
  - Assign the AI agent
  - Set call behavior rules (max attempts, retry timing, call hours)
  - Choose campaign type: OUTBOUND or INBOUND

### Step 4 — Import Leads
  - Upload a CSV file: name, phone, email
  - OR paste a JSON array
  - Leads are assigned to the campaign with status NEW

### Step 5 — Activate Campaign
  - Status flips: DRAFT → ACTIVE
  - The system begins dialing leads via Twilio

### Step 6 — AI Agent Makes Real Calls (The Magic)
  Twilio dials the lead's phone number.
  When they pick up:
    1. Agent plays its opening script (Text-to-Speech via Google TTS)
    2. Lead responds (recorded audio)
    3. Groq Whisper transcribes their speech to text
    4. Intent is detected (interested / objecting / asking price / etc.)
    5. Llama 3.3 generates the next natural response
    6. Google TTS speaks it back
    7. Loop continues until a call outcome is reached

  Call outcomes saved per call:
    - interested     → Lead status: INTERESTED
    - booked         → Lead status: BOOKED (meeting confirmed)
    - follow_up      → Schedules a callback
    - not_interested → Lead status: NOT_INTERESTED
    - no_answer      → Lead status: NO_ANSWER

  Every call saves: full transcript, duration, sentiment score, outcome.

### Step 7 — Inbound Calls
  Someone calls the Twilio phone number.
  Twilio triggers the /api/voice/inbound webhook.
  The AI agent answers, qualifies the caller, and logs the call.
  If the caller is a known lead, their campaign agent handles the call.

### Step 8 — Dashboard
  Real-time stats:
    - Total leads, active campaigns, active agents
    - Conversion rate (booked / total called)
    - Average call duration
    - Outcome breakdown (pie: booked vs interested vs not interested)
    - Per-campaign performance table
    - 10 most recent calls with lead name + outcome

### Step 9 — Sandbox (Pre-Launch Testing)
  Before going live, the user can test their agent by:
    - Typing messages (text sandbox → full LLM response)
    - Speaking into their mic (voice sandbox → full STT→LLM→TTS pipeline)
  No real calls or credits used.

---

## Frontend Pages

  / (Landing)           — Marketing page, login/signup
  /dashboard            — Stats overview
  /onboarding           — AI interview chat UI
  /agents               — View/edit/deploy generated agents
  /agents/[id]          — Agent detail: system prompt, conv tree, call logs
  /campaigns            — Create/manage campaigns
  /campaigns/[id]       — Campaign detail: leads table, stats, activate/pause
  /leads                — All leads across campaigns, filter by status
  /sandbox              — Test agent (text or voice)
  /settings             — Business info, profile, Twilio phone number

---

## Tech Stack

  Framework       Next.js 16 (App Router)
  Database        Prisma ORM + SQLite (dev) → Postgres (prod)
  Auth            NextAuth.js (email/password)
  LLM             Groq — llama-3.3-70b-versatile
  STT             Groq Whisper — whisper-large-v3-turbo
  TTS             Google Translate TTS (free)
  Phone Calls     Twilio (real numbers, outbound + inbound)
  UI              shadcn/ui + Radix UI + Tailwind CSS + Framer Motion

---

## Database Models

  User
    ├── OnboardingSession  (conversation history, collected fields, state)
    ├── Agent              (systemPrompt, openingScript, convTree, voiceProfile)
    ├── Campaign           (type, status, aiModel, aiPersonality, callBehavior)
    │    └── Lead          (name, phone, email, status, score, lastCall)
    │         └── CallLog  (transcript, outcome, duration, sentiment, followUpAt)
    └── AgentConfig        (global settings: AgentConfig)

---

## Environment Variables Required

  DATABASE_URL          = file:./dev.db
  NEXTAUTH_SECRET       = (any random string)
  NEXTAUTH_URL          = http://localhost:3000
  GROQ_API_KEY          = gsk_...
  TWILIO_ACCOUNT_SID    = AC...         ← needed for real calls
  TWILIO_AUTH_TOKEN     = (from Twilio) ← needed for real calls
  TWILIO_PHONE_NUMBER   = +1...         ← your Twilio number

---

## What's Working Right Now

  [x] User signup & login
  [x] AI onboarding interview (multi-turn, history persisted)
  [x] Agent auto-generation from onboarding answers
  [x] Campaign CRUD + activate/pause/resume
  [x] Lead import (CSV + JSON), full CRUD
  [x] Text sandbox (test agent responses)
  [x] Voice sandbox (mic → STT → LLM → TTS → speaker)
  [x] Dashboard stats with outcome + sentiment analytics
  [x] Call logging with transcript + outcome
  [x] Settings (business info + profile)

## What Needs Twilio Credentials to Activate

  [ ] Real outbound phone calls to leads
  [ ] Real inbound call answering
  [ ] Assigning a real phone number to your account

---

## MVP Scope (What We're NOT Building Yet)

  - CRM integrations (Salesforce, HubSpot)
  - Dedicated phone numbers per user (shared number in MVP)
  - Email/SMS follow-up sequences
  - Calendar integrations (Calendly, Google Calendar)
  - Multi-user teams / workspaces
  - Billing / subscription management
