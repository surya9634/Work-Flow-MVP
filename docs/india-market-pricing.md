# 🇮🇳 Indian Market — Competitive Analysis & Pricing Strategy
**Work-Flow AI Voice Agent Platform**
*Last updated: March 2026*

---

## 1. Indian Competitor Agencies & Their Pricing

### A. AI Voice Bot / Conversational AI Platforms

| Company | Type | Pricing (INR/USD) | Notes |
|---------|------|-------------------|-------|
| **Skit.ai** | Indian AI voice bot | ₹8–15/min or custom enterprise | Focused on IVR replacement, strong Hindi support |
| **Yellow.ai** | Conversational AI (voice + chat) | $0.15–$0.25/min (enterprise) | End-to-end platform, expensive |
| **Uniphore** | Enterprise voice AI | Custom — ₹5L–₹50L/year | Large enterprise only, not SMB-friendly |
| **Observe.AI** | Call analytics + AI | $0.10–$0.15/min | Analytics-heavy, not full automation |
| **CoRover.ai** | Multilingual voice bot | ₹2–₹8/min | Government projects, decent Hindi coverage |
| **Vernacular.ai** | Hindi/regional voice AI | ₹5–₹12/min | Strong regional language support |

### B. Cloud Telephony (Indian Twilio Alternatives)

| Provider | Outbound Call Rate (India) | Notes |
|----------|---------------------------|-------|
| **Exotel** | ₹0.50–₹0.90/min | Most popular Indian CPaaS, great uptime |
| **Knowlarity** | ₹0.60–₹1.00/min | Strong SMB presence |
| **MyOperator** | ₹0.70–₹1.20/min | Good for SMB sales teams |
| **Servetel** | ₹0.50–₹0.80/min | Budget option |
| **Plivo** | $0.0085/min (~₹0.71) | International but India support, cheaper than Twilio |
| **Twilio (current)** | $0.014–$0.022/min (~₹1.17–1.85) | 2–3× more expensive than Indian alternatives |

> 💡 **Key insight:** Switching from Twilio → Exotel for Indian calls saves ₹0.60–₹1.10/minute — equivalent to **50–60% reduction** in telephony cost

### C. Traditional Call Center Agencies (Our Indirect Competitors)

| Agency Type | Model | Cost |
|-------------|-------|------|
| BPO / Call Center (human agents) | Per seat or per minute | ₹15–₹40/min (including agent salary, infra) |
| Semi-automated IVR | Setup + per-minute | ₹3–₹8/min |
| Outsourced SDR team | Per lead / monthly | ₹25,000–₹1,50,000/month per agent |

**Our automated AI agent effectively replaces a ₹25K–₹1.5L/month human SDR.** That's the value anchor.

---

## 2. Our Platform's Real Costs (Per Call Minute)

### Without Twilio (User Brings Own Phone Number)

| Component | Provider | Cost/minute |
|-----------|----------|-------------|
| **TTS** | Cartesia Sonic-2 | ₹0.24/min (~$0.028) |
| **STT** | Groq Whisper Turbo | ₹0.005/min ($0.0006) |
| **LLM** | Groq Llama-3.1-8B | ₹0.003/min ($0.0003) |
| **Subtotal** | | **~₹0.25/min (~$0.029)** |

### With Exotel Telephony (We Handle Calls, Indian Numbers)

| Component | Cost/minute |
|-----------|-------------|
| TTS + STT + LLM | ₹0.25 |
| Exotel outbound | ₹0.70 |
| **Total** | **~₹0.95/min (~$0.011)** |

### With Twilio Telephony (Current Setup)

| Component | Cost/minute |
|-----------|-------------|
| TTS + STT + LLM | ₹0.25 |
| Twilio outbound | ₹1.50 |
| **Total** | **~₹1.75/min (~$0.021)** |

---

## 3. Our Recommended Credit System (India-Optimized)

**India pricing (INR): 1 credit = 1 call minute**

### Credit Packs (Indian Market)

| Pack | Credits | INR Price | Per Credit | Our Cost | Margin |
|------|---------|-----------|-----------|----------|--------|
| **Starter** | 100 min | **₹499** | ₹4.99/min | ₹0.95 | **81%** |
| **Growth** | 600 min | **₹1,999** | ₹3.33/min | ₹0.95 | **71%** |
| **Pro** | 3,000 min | **₹7,999** | ₹2.67/min | ₹0.95 | **64%** |
| **Scale** | 15,000 min | **₹29,999** | ₹2.00/min | ₹0.95 | **52%** |

### Versus Competitors
| Product | Price/min | Work-Flow Discount |
|---------|-----------|-------------------|
| Skit.ai | ₹8–₹15/min | **40–70% cheaper** |
| Yellow.ai | ₹12–₹20/min | **60–80% cheaper** |
| Human SDR | ₹25–₹40/min | **85–95% cheaper** |
| BPO Call Center | ₹15–₹40/min | **75–95% cheaper** |

---

## 4. Strategy to Reduce Costs Further

### 🔴 HIGH IMPACT

#### 1. Switch Telephony: Twilio → Exotel (India) + Twilio (International)
- **Saving: ₹0.60–₹1.10/min on Indian calls**
- Exotel API is very similar to Twilio — migration is ~1–2 days of work
- Routing: If lead phone starts with `+91` → Exotel. Else → Twilio
- Estimated savings at 10,000 min/month: **₹8,000–₹10,000/month**

#### 2. TTS Response Caching
- Cache frequently spoken phrases (greetings, objection responses, confirmations)
- Cartesia charges per character — cached phrases cost $0
- Common phrases like "I completely understand that..." get reused hundreds of times
- **Estimated TTS cost reduction: 15–25%**
- Implementation: Redis/memory cache keyed on `(text, voiceId)` → base64 audio

#### 3. Sarvam AI for Hindi STT (Indian Alternative)
- Sarvam AI: Indian startup, built for Indic languages
- Pricing: ~₹0.20/min (vs Groq ₹0.05/min) — actually more expensive but far more accurate for Hindi
- **ROI:** Better accuracy → fewer misheard turns → shorter calls → less total cost
- Use Sarvam for Hindi calls, Groq Whisper for English

### 🟡 MEDIUM IMPACT

#### 4. LLM Routing by Complexity
- Simple turns ("yes", "that sounds good", "tell me more") → use Llama-3.1-8B (cheapest)
- Complex objection handling → use Llama-3.3-70B or Mixtral
- Classify complexity with a 1-token probe first
- **Estimated LLM cost reduction: 30–40%** (LLM is <5% of total cost anyway)

#### 5. Short-Circuit Calls Early
- If prospect says "not interested" in turn 1–2, end the call immediately
- Current system may keep talking past clear rejection signals
- **Estimated savings: 10–15% fewer minutes billed**

#### 6. Audio Compression
- Reduce audio bitrate for STT input before sending to Groq
- 48kHz WAV → 16kHz mono WAV → 4× smaller file → faster upload → lower latency
- No change in Groq cost (charged per second, not per byte)

### 🟢 LOWER PRIORITY

#### 7. Negotiate Cartesia Volume Pricing
- At $500+/month TTS spend, Cartesia offers custom enterprise rates
- Typical discount: 20–30% at mid volume
- At scale (1M+ chars/day), negotiate to ~$0.00010/char (from $0.00014)

#### 8. Self-Host STT at Scale
- Whisper runs on-premise on a single GPU (A10G ~$1.20/hr on Lambda Labs)
- At 10,000 min/day of audio: self-hosting breaks even vs Groq at ~$0.70/hr GPU
- Not worth it below ~5,000 hours/month total audio

#### 9. Credits Expiry Policy
- Add 12-month credit expiry
- Industry average: 15–20% of purchased credits are never used (breakage)
- At scale this adds 15–20% to effective margin without changing any prices

---

## 5. Recommended Stack by Volume Tier

| Monthly Volume | Telephony | TTS | STT | LLM | Est. Cost/min |
|---------------|-----------|-----|-----|-----|--------------|
| **0–1K min** | Twilio | Cartesia | Groq | Groq 8B | ₹1.75 |
| **1K–20K min** | Exotel (IN) + Twilio (INT) | Cartesia + Cache | Groq | Groq 8B | ₹1.00 |
| **20K–200K min** | Exotel + negotiated Twilio | Cartesia (volume deal) | Groq | Groq 8B | ₹0.75 |
| **200K+ min** | Exotel + own SIP trunk | Cartesia custom | Sarvam (Hindi) / Groq | Groq 8B + 70B routing | ₹0.50 |

---

## 6. How to Handle Phone Numbers for Customers

Because of TRAI/DoT regulations, you cannot programmatically sell Indian (+91) phone numbers without manual KYC. Here is how you handle this:

### Phase 1: Shared Number (For MVP/Trials)
All customers use your platform's single Exotel virtual number for outbound campaigns.
* **Pro:** Instant onboarding. Users deposit credits and start calling immediately.
* **Con:** Shared Truecaller reputation. If one user acts spammy, it affects everyone.

### Phase 2: Exotel White-Label Partnership (The Profitable Way)
Once you have traction, you sign an NDA and Partnership Agreement with Exotel as an ISV (Independent Software Vendor). 
* **How it works:** You collect KYC (Aadhaar, GST, PAN, Company Registration) from your user inside your dashboard.
* **Provisioning:** Your account manager at Exotel provisions a dedicated ExoPhone under a sub-account tied to your master account.
* **Revenue 1:** Exotel charges you ₹500/month for the number. You charge your user ₹1,000/month (100% markup). 
* **Revenue 2:** Exotel charges you ₹0.70/min. You charge your user ₹2.00–₹5.00/min in credits.
* **Brand:** Exotel is completely hidden from your user. They only know "Work-Flow Voice Delivery".

### Phase 3: "Bring Your Own Carrier" (Enterprise)
For massive enterprises who already have their own Exotel/Knowlarity accounts, they simply paste their API keys into your settings page. You only charge them for the AI processing (TTS+STT+LLM) at a flat markup, and they pay their telecom provider directly for the call minutes.

---

## 7. Positioning Statement for Indian Market

> **"India's first AI sales agent platform built for Indian voices and Indian prices. Replace a ₹40,000/month SDR with Work-Flow at ₹1,999/month. Your agent speaks Hindi, English, and Hinglish — 24/7, zero sick days."**

### Key Angles
- **Price**: ₹2–₹5/min vs ₹15–₹40/min for BPO/human — **8–20× cheaper**
- **Language**: Hindi + Hinglish + English voices (Cartesia Indian voices already integrated)
- **Speed**: Agent responds in <2 seconds (after our latency optimizations)
- **Compliance**: Data stays in India (Supabase can be India-region)
