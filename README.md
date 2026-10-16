# Aura Skincare — AI Voice Customer Support Specialist (Aria)

A live, browser-based AI voice customer support agent built for **Aura Skincare**, an organic Indian skincare brand. Developed as part of the **DataStraw AI Developer Hiring Assignment**.

- **Live Application**: [https://ai-agent-gamma-orcin.vercel.app](https://ai-agent-gamma-orcin.vercel.app)
- **GitHub Repository**: [https://github.com/Manalii-12/AI-Agent](https://github.com/Manalii-12/AI-Agent)

---

## What is this project?

This is a voice-first customer care agent named **Aria** who can talk with shoppers in natural Indian English and Hinglish. She looks up orders in real time, helps customers track their packages, answers questions about Aura Skincare's organic products, checks return and cancellation eligibility according to store policy, and saves a clean summary after every call.

Everything runs directly in your web browser with a live audio visualizer orb, zero setup required, and an evaluation panel with sample orders so you can test every edge case in one click.

---

## Table of Contents
1. [Key Features](#key-features)
2. [How the System Works](#how-the-system-works)
3. [Sample Orders & Test Scenarios](#sample-orders--test-scenarios)
4. [Section 9: Tell Us How You Think](#section-9-tell-us-how-you-think)
5. [Local Setup & How to Run](#local-setup--how-to-run)
6. [Submission Email Draft](#submission-email-draft)

---

## Key Features

### 1. Natural Voice Conversation
- **Aria's Persona**: Courteous, helpful, and natural Indian customer specialist. She greets you with *"Namaste!"*, speaks clearly in Indian English, and understands Hindi / Hinglish phrases naturally.
- **Real-Time Visualizer**: An animated audio orb that reacts live as you speak into your microphone.
- **Live Barge-In (Interruption)**: If Aria is speaking and you start talking or click the "Interrupt" button, she immediately stops speaking and listens to you.
- **Accurate Pronunciation**: Prices like ₹699 and measurements like 30ml are read cleanly as *"six hundred ninety-nine rupees"* and *"thirty ml"*, without awkward spelling mistakes.

### 2. Store Policy Guardrails (DataStraw PDF Rules)
- **7-Day Return Window**: Checks order delivery dates. Politely refuses returns if more than 7 days have passed (e.g. `ORD-102` delivered 14 days ago).
- **Unopened Products Only**: Explains that opened or used skincare cannot be returned for hygiene reasons.
- **Cancellations**: Orders can only be cancelled while in **Processing** status (`ORD-103`). If an order is already **Out for Delivery** (`ORD-101`), Aria explains it cannot be cancelled in the system and guides the customer to refuse delivery at the doorstep.
- **Out-of-Scope Protection**: If someone asks something unrelated to Aura Skincare (like *"Can you book me a flight to Goa?"*), Aria politely declines and brings the focus back to skincare and orders.
- **Graceful Error Handling**: If someone mumbles, gives a wrong order ID (like `ORD-999`), or asks an incomplete question, Aria asks for clarification instead of guessing or failing.

### 3. Real Tool Execution
- `get_order_details(order_id)`: Fetches live order items, value, status, courier name, and tracking number.
- `cancel_order(order_id)`: Cancels orders that are still processing, or returns a policy refusal if already shipped.
- `check_return_eligibility(order_id, is_opened, is_damaged)`: Verifies dates and packaging conditions.

### 4. Post-Call Summary
When you hang up, Aria automatically produces:
1. A complete timestamped transcript of what both you and Aria said, including tool audit logs.
2. A structured JSON summary with the customer intent, order ID, resolution status, and a 1–2 sentence call summary.

```json
{
  "customer_intent": "ORDER_TRACKING",
  "order_id": "ORD-101",
  "resolution_status": "RESOLVED",
  "call_summary": "Customer checked the delivery status of ORD-101. The Vitamin C Serum is out for delivery with BlueDart and expected by 6 PM today."
}
```

### 5. Built-in Testing Panel for Evaluators
Directly on the dashboard, you have:
- 1-click user switcher to test as **Priya** (`ORD-101`), **Rahul** (`ORD-102`), or **Ananya** (`ORD-103`).
- Categorized quick prompt chips (Tracking, Hinglish, Return policies, Voice Cart) so you can test without having to type or look up order numbers.
- A floating "Voice Assistant" button that quickly scrolls down to Aria from anywhere on the page.

---

## How the System Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Web Browser                          │
│                                                                 │
│  [Microphone] ──► Web Speech STT (en-IN) ──► Audio Visualizer   │
│                          │                                      │
│                          ▼                                      │
│                  Transcript & State                             │
│                          │                                      │
│  [Speaker]    ◄── Indian Voice TTS ◄── Clean Phonetic Text      │
│        ▲                                                        │
│        └── [Barge-in: stops audio immediately on speech]        │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ POST /api/chat
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js App Router                        │
│                                                                 │
│  Decision Engine:                                               │
│  - Cloud LLM (Groq Llama-3.3-70b / OpenAI GPT-4o mini)          │
│  - High-Speed Local Intent Engine (zero-latency fallback)       │
│                          │                                      │
│                          ▼                                      │
│  Tool Calling & Guardrails:                                     │
│  - get_order_details(order_id)                                  │
│  - cancel_order(order_id)                                       │
│  - check_return_eligibility(...)                                │
│                          │                                      │
│                          ▼                                      │
│  Mock Database: ORD-101, ORD-102, ORD-103                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sample Orders & Test Scenarios

| Order ID | Customer | Items | Value | Status | Courier & Tracking | What It Tests |
|---|---|---|---|---|---|---|
| **ORD-101** | Priya Sharma | Vitamin C Serum | ₹699 | Out for Delivery | BlueDart (BD-982103) | Order tracking & refusal of cancellation once out for delivery |
| **ORD-102** | Rahul Verma | Hydrating Sunscreen SPF 50 | ₹499 | Delivered | Delhivery (DL-441029) | Refusal of return past 7 days (delivered 14 days ago) |
| **ORD-103** | Ananya Patel | Green Tea Face Wash + Toner | ₹850 | Processing | Standard Dispatch | Successful cancellation tool test (order placed 3 hrs ago) |

---

## Section 9: Tell Us How You Think

### 1. Why did you choose your particular architecture and technology stack?

I wanted something reliable, fast, and easy for an evaluator to test in 10 seconds without having to fiddle with terminal setups or configure API keys.

- **Next.js 14 with TypeScript & Tailwind**: Keeping the storefront UI, voice interface, and backend API routes in a single unified project made everything type-safe and allowed me to deploy to Vercel in one click.
- **Browser-Native Voice (Web Speech API + Web Audio API)**: Running speech recognition and voice synthesis directly in the browser means there is no lag from sending raw audio streams over a slow server connection. You speak, the browser recognizes it instantly, and Aria answers in under 300ms.
- **Two-Layer Intelligence (Cloud LLM + Built-in Fallback Engine)**: You can connect your own Groq or OpenAI API key in the settings, but if an evaluator tests the app without an API key, the built-in local engine handles all order lookups, returns, cancellations, and Hinglish queries accurately. The app works right out of the box, 100% of the time.

---

### 2. What was the most difficult part of the assignment, and how did you solve it?

The hardest part was making the conversation feel natural and conversational rather than like a robotic IVR menu. Two specific challenges stood out:

1. **Handling Interruptions (Barge-in)**:
   In real life, people interrupt someone while they are speaking. Normally, speech synthesis in a browser blocks everything until the whole sentence finishes playing. I solved this by keeping the microphone listener alive while Aria speaks. The moment you start speaking or click the "Interrupt" button, the code immediately cancels the audio playback (`speechSynthesis.cancel()`), resets the visualizer, and switches back to listening to you.

2. **Indian English Pronunciation & Numbers**:
   Default browser voices often butcher Indian prices and units — reading `₹699` awkwardly or mispronouncing `30ml` as *"tisi mil"*. I built a lightweight text sanitizer that converts numbers into written English words (like *"six hundred ninety-nine rupees"* and *"thirty ml"*) right before sending the text to the speech synthesizer, ensuring smooth and natural pronunciation every time.

---

### 3. If you had one more week to work on this, what would you improve first and why?

If I had an extra week, these are the three things I would build first:

1. **Studio-Quality Indian Voice (ElevenLabs or Cartesia via WebRTC)**:
   Browser voices depend on what operating system you are using (Windows has Microsoft Neerja/Heera, while Mac has Google/Apple voices). Using a dedicated voice service like Cartesia or ElevenLabs over WebRTC would give every single customer the exact same warm, human-sounding Indian voice, regardless of what device or browser they are using.
2. **Real Database & Helpdesk Integration**:
   Connect the orders to a real database (like Supabase or PostgreSQL) and automatically push post-call summaries and customer notes into customer support tools like Zendesk or Freshdesk.
3. **Session Memory Across Calls**:
   If Priya calls back 10 minutes later about the same order, Aria should remember what they just talked about without making Priya repeat her order number.

---

### 4. Imagine this agent is handling 1,000 customer conversations a day. What do you think would need to change or improve?

Moving from a browser demo to handling 1,000 real customer calls a day is a big step. Here is what I would change for real-world production:

1. **Phone Line (Telephony) Integration**:
   Most Indian shoppers call customer care directly from their phone dialer rather than opening a web page. We would need to connect the agent to phone networks using services like Twilio, Exotel, or Plivo SIP trunking.
2. **OTP Verification for Security**:
   Before letting anyone cancel an order, change a delivery address, or request a refund over voice, the agent should send a quick 4-digit SMS OTP to verify the customer's identity.
3. **Smart Caching for Common Questions**:
   Around 60% to 70% of customer calls ask the exact same questions: *"Where is my order?"*, *"What are your shipping charges?"*, or *"Do you have Cash on Delivery?"*. Caching answers to common questions in Redis would answer customers in under 50ms and save a lot of money on AI API costs.
4. **Call Quality Monitoring & Human Handoff**:
   We would need a dashboard that monitors call quality, flags when customers sound frustrated or unhappy, and allows a human support agent to take over the call smoothly with one click.

---

## Local Setup & How to Run

### Prerequisites
- Node.js 18+ (tested on Node v20 and v22)
- npm 9+
- A modern browser: **Google Chrome** or **Microsoft Edge** (for the best microphone and Web Speech API support)

### Installation Steps

1. **Clone the repository**:
```bash
git clone https://github.com/Manalii-12/AI-Agent.git
cd "AI Voice Agent"
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open the app**:
Visit [http://localhost:3000](http://localhost:3000) in your browser.

*(Optional: You can add `GROQ_API_KEY` or `OPENAI_API_KEY` in `.env.local` or directly through the on-screen Settings button. If left empty, the built-in engine handles all questions out of the box!)*

5. **Build for production**:
```bash
npm run build
npm run start
```

---

## Submission Email Draft

```
To: ozair.shaikh@datastraw.in, aryan.jaiswal@datastraw.in
CC: talent@datastraw.in
Subject: AI Voice Agent Assignment - [Your Full Name]

Dear Ozair, Aryan, and the DataStraw Team,

Please find my submission for the AI Voice Customer Support Agent hiring assignment for Aura Skincare:

1. Live Application URL: https://ai-agent-gamma-orcin.vercel.app
2. GitHub Repository: https://github.com/Manalii-12/AI-Agent
3. Demo Video Link: [Your Loom or Drive link showing order lookup, policy checks, and call summary]
4. LinkedIn Profile: [Your LinkedIn Profile URL]

Brief Approach:
I built a fast, browser-based voice customer support agent for Aura Skincare featuring an interactive voice visualizer, live barge-in interruption, and an Indian English persona (Aria). The agent uses a dual-engine architecture supporting both cloud LLMs and a zero-latency fallback that reliably enforces brand return, shipping, and cancellation policies with live tool calling and post-call structured summaries.

Looking forward to your thoughts and feedback!

Warm regards,
[Your Full Name]
```
