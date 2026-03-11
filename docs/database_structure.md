# Database Structure & Relationships

This document explains the database architecture of the Voice Agent SaaS platform, based on the Prisma schema.

## Core Models

### 1. User
The central entity of the application. Every user who signs up gets a `User` record.
- **Fields:** `email`, `passwordHash`, `businessName`, `credits`, `metaAccessToken` (for WhatsApp), etc.
- **Relationships:**
  - One-to-Many with `Agent` (A user can create multiple AI agents).
  - One-to-Many with `Campaign` (A user can run multiple outbound campaigns).
  - One-to-Many with `Lead` (A user owns their imported leads).
  - One-to-One with `AgentConfig` (Legacy global config).
  - One-to-Many with `OnboardingSession`.

### 2. Agent
Represents an AI Voice Assistant created by the user.
- **Fields:** `name`, `systemPrompt`, `voiceProfile`, `llmModel`, `phoneNumberId` (Twilio assigned number).
- **Relationships:**
  - Belongs to a `User`.
  - One-to-Many with `Campaign` (An agent is assigned to handle specific campaigns).
  - One-to-Many with `CallLog` (Logs of all voice calls this agent has made or received).
  - One-to-Many with `InteractionLog` (Logs of all WhatsApp/SMS chats by this agent).
  - One-to-Many with `AgentVersion` (Tracks prompt/config history).

### 3. Lead
Represents a contact (customer/prospect) that the user wants to call or message.
- **Fields:** `name`, `phone`, `email`, `status`, `score`.
- **Relationships:**
  - Belongs to a `User` (The owner of the lead).
  - Belongs to a `Campaign` (Optional - if the lead is part of an active outbound campaign).
  - One-to-Many with `CallLog` and `InteractionLog` (All history associated with this specific person).

### 4. Campaign
Represents a batch operation (e.g., calling 500 leads to sell a product).
- **Fields:** `name`, `type` (OUTBOUND), `status`, `objective`.
- **Relationships:**
  - Belongs to a `User`.
  - Belongs to an `Agent` (The AI chosen to execute the campaign).
  - One-to-Many with `Lead` (The list of targets for the campaign).

---

## Log Models (The "Activity" Data)

### 5. CallLog
Records every single Voice Call made or received by the system.
- **Fields:** `duration`, `status` (completed, failed), `outcome`, `recordingUrl`, `transcript`, `sentiment`.
- **Relationships:**
  - Belongs to a `Lead` (Who was called).
  - Belongs to an `Agent` (Which AI took the call).
  - Belongs to a `Campaign` (Optional).
  - **One-to-One with `LeadScore`** (The AI scores the lead after the call based on budget/authority).

### 6. InteractionLog
Records every text-based interaction (WhatsApp, SMS).
- **Fields:** `type` (WHATSAPP, SMS), `direction` (INBOUND, OUTBOUND), `message` (The actual chat text), `status`.
- **Relationships:**
  - Belongs to a `Lead`, `Agent`, and `Campaign` similarly to CallLogs.

---

## Auxiliary Models

- **LeadScore:** Derived after a `CallLog` finishes. The AI grades the lead from 0-100 based on the conversation transcript (BANT criteria).
- **PhoneNumber:** System inventory of Twilio phone numbers assigned to users/agents.
- **Integration:** Stores third-party connections (e.g., Hubspot, Zapier).
- **OnboardingSession:** Tracks the setup process when a new user first registers.

## Map Summary
`User` -> creates -> `Agent` & `Campaign` -> calls -> `Lead` -> generates -> `CallLog` & `InteractionLog` -> generates -> `LeadScore`
