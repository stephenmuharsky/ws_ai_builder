# AI-Powered Client Intake & Qualification Pipeline — System Specification

## Purpose of This Document
This document describes a complete AI system to be built as a job application prototype for Wealthsimple's "AI Builder" role. It will be fed into a prompt designer to produce a master build prompt. The system is being **adapted from an existing production WhatsApp booking automation system** — significant infrastructure already exists and must be reused.

---

## What We're Building

An AI-powered client intake and qualification pipeline for a small financial advisory firm (3-5 advisors). The system replaces the manual, error-prone process of: receiving an inquiry → manually reviewing it → emailing back and forth → scheduling a consultation → hoping the lead is actually qualified.

### The Full Flow

```
INTAKE FORM → AUTO-DISQUALIFICATION → AI ENRICHMENT → ADMIN DASHBOARD → HUMAN APPROVE/REJECT → AI EMAIL OUTREACH & BOOKING
```

---

## Stage-by-Stage Breakdown

### Stage 1: Intake Form (React Frontend)

Prospective client fills out a web form. Submission hits an n8n webhook.

**Fields collected:**
- Full Name
- Email
- Phone Number
- Province/State of Residence
- Investable Assets Range (dropdown: Under $25K / $25K-$100K / $100K-$250K / $250K-$500K / $500K-$1M / $1M+)
- Annual Income Range (dropdown: Under $50K / $50K-$100K / $100K-$200K / $200K-$500K / $500K+)
- Primary Financial Goal (multi-select: Retirement Planning / Wealth Growth / Tax Optimization / Estate Planning / Debt Management / Education Savings)
- Investment Timeline (dropdown: Under 1 year / 1-3 years / 3-5 years / 5-10 years / 10+ years)
- Risk Tolerance (slider or radio: Conservative / Moderate / Aggressive)
- Current Advisor Situation (radio: I have an advisor and want to switch / I've never had an advisor / I had one but don't currently)
- Preferred Consultation Date & Time (date picker + time picker)
- Backup Date & Time (date picker + time picker)
- Free-text: "Is there anything else we should know about your financial situation or goals?"
- Consent checkbox: "I consent to being contacted about financial advisory services"

On submit: POST to n8n webhook → triggers processing pipeline.

### Stage 2: AI Processing (Fully Automated)

Three sequential steps, all in n8n:

#### 2a. Auto-Disqualification (Deterministic Code Node — NOT AI)

Hard rules with no ambiguity:
- **Jurisdiction**: Province/State not in firm's served list → DISQUALIFIED
- **Minimum assets**: Below firm threshold (configurable, e.g., $100K) → DISQUALIFIED  
- **Goal mismatch**: If firm doesn't offer a service matching any selected goal → DISQUALIFIED

Disqualified leads:
- Logged to Leads sheet with Status = DISQUALIFIED and reason
- Receive an immediate automated email: polite, professional, includes links to alternative resources (robo-advisors, free financial planning tools, educational content)
- These still appear on admin dashboard under "Auto-Rejected" tab so admin can override false positives

Leads that pass disqualification proceed to AI enrichment.

#### 2b. AI Enrichment (AI Agent with Structured Output)

AI analyzes the intake data and generates:

1. **Client Profile Summary** — 3-4 sentence natural language synthesis: "Sarah is a 45-year-old professional in Ontario with $350K in investable assets. She's primarily focused on retirement planning with a moderate risk tolerance and a 10+ year horizon. She currently has an advisor but is looking to switch, which suggests dissatisfaction with her current service. Her mention of 'recent inheritance' in the notes may indicate a liquidity event requiring immediate attention."

2. **Recommended Service Tier** — Maps to firm's offerings (e.g., "Comprehensive Wealth Management" vs. "Retirement Planning Package" vs. "Tax-Focused Advisory")

3. **Advisor Match Ranking** — Ranks available advisors by fit:
   - Specialization match (retirement specialist for retirement goals, etc.)
   - Current caseload (advisors near capacity ranked lower)
   - Availability within requested time window
   - Output: ordered list of advisor IDs with match reasoning

4. **Conversation Starters** — 3 suggested talking points for the initial consultation tailored to this client's stated goals and situation

5. **Risk Flags** — Anything the advisor should be aware of:
   - "Mentions divorce — may have complex asset division needs"
   - "Very short timeline + aggressive risk tolerance — expectations management needed"
   - "Switching from another advisor — ask about pain points"
   - "Free text mentions crypto/day trading — may expect services outside firm's scope"

6. **Priority Score** — HIGH / MEDIUM / LOW based on: asset level, urgency signals in free text, goal-service fit quality, timeline

All output is structured JSON, saved to the Leads sheet, and cached in Redis for dashboard access.

#### 2c. Preferred Time Availability Check (Reused Logic)

Before the application reaches the admin dashboard, the system pre-checks:
- Is the client's preferred date/time available with the top-ranked qualified advisor?
- If yes: pre-populate the suggested booking (admin just approves and it's instantly scheduled)
- If no: check backup time. If also no: flag as "scheduling required" — email back-and-forth will be needed after approval

This uses the existing availability checking engine from the booking system, adapted for advisors instead of technicians.

### Stage 3: Admin Dashboard (React Frontend)

Web dashboard where the admin (or senior advisor) reviews and acts on leads.

**Three views/tabs:**

**Tab 1 — Pending Review** (leads that passed auto-disqualification, awaiting human decision):
Each lead displayed as an expandable card showing:
- Client name, email, phone
- Priority score badge (HIGH = red, MEDIUM = yellow, LOW = green)  
- AI Profile Summary (the 3-4 sentence synthesis)
- Recommended Service Tier
- Suggested Advisor (with match reasoning)
- Risk Flags (highlighted in amber/red)
- Preferred time availability status ("Available with [Advisor] ✅" or "Scheduling needed ⚠️")
- Conversation Starters (collapsed, expandable)
- Raw form data (collapsed, expandable)

Actions per card:
- **Approve** — Assigns to suggested advisor (or admin picks different one from dropdown). If preferred time was available, consultation is booked instantly. If not, triggers email outreach for scheduling.
- **Reject** — Admin selects a reason from dropdown (Below threshold on closer review / Not a fit for our services / Incomplete information / Other). AI generates and sends personalized rejection email with appropriate next-step resources.
- **Request More Info** — Admin types a follow-up question. AI sends it to client via email, lead moves to "Awaiting Response" state.
- **Assign Different Advisor** — Override AI's suggestion before approving.

**Tab 2 — Auto-Rejected** (failed disqualification rules):
Same card format but showing disqualification reason prominently.
- **Override** action: moves lead back to Pending Review for full consideration. Use case: someone put "$50K" in assets but wrote "just received $2M inheritance" in free text.

**Tab 3 — Active & Completed**:
- In Progress: approved leads where email outreach / booking is underway
- Booked: consultation scheduled, showing date/time/advisor
- Unresponsive: no reply after follow-up sequence
- Completed: consultation happened

**Dashboard metrics bar (top):**
- Total leads this week/month
- Conversion rate (leads → booked consultations)
- Average time from submission to booked consultation
- Leads pending review count

### Stage 4: AI Email Outreach & Booking

Once admin approves a lead:

**If preferred time was available:**
- AI sends confirmation email immediately: "Hi [Name], great news — we've matched you with [Advisor Name], who specializes in [goal]. Your initial consultation is confirmed for [Date] at [Time]. Here's what to expect: [brief description]. Please reply to this email if you need to reschedule."
- Appointment created in Google Calendar + Appointments sheet
- Done. No back-and-forth needed.

**If preferred time was NOT available:**
- AI sends personalized outreach email: "Hi [Name], thank you for your interest in [Firm]. We'd love to set up an initial consultation with [Advisor Name], who specializes in [goal]. Unfortunately, [preferred time] isn't available. Here are some times that work: [list 3-4 available slots in the next 5 business days]. Would any of these work for you? Or feel free to suggest another time."
- Client replies via email
- n8n receives reply (via email trigger or webhook)
- AI parses their response, checks availability, confirms or offers alternatives
- Multi-turn conversation continues until booked or marked unresponsive
- **This is where the existing WhatsApp booking engine is adapted for email** — same state management, same availability logic, same alternative presentation, same confirmation flow

**Follow-up cadence (automated):**
- No reply after 48 hours → Follow-up email #1: "Just checking in — would you still like to schedule a consultation?"
- No reply after 96 hours → Follow-up email #2: "We'd love to connect when you're ready. You can reply to this email anytime or visit [booking link]."
- No reply after 7 days → Status set to UNRESPONSIVE, flagged on dashboard

**For rejected applicants (admin-rejected):**
- Admin selects rejection reason
- AI generates appropriate email:
  - "Below threshold but close" → nurture email: "We'd love to work with you — here's how to get started on your own, and feel free to reach out when you're ready"
  - "Not a fit for services" → redirect email: suggests better-suited alternatives
  - "Incomplete info" → request for more information

---

## The Existing System Being Adapted

### What Already Exists (Production-Grade)
We have a fully functional WhatsApp-based booking automation system built for a service business (nail salon in Cancún, Mexico). It runs on:
- **n8n** — 7 interconnected workflows, 357 nodes in the main workflow alone
- **Redis** — session state, message batching, rate limiting, business data cache
- **Google Sheets** — 9 tabs covering bookings, contacts, services, employees, availability, earnings, configuration
- **Google Calendar** — event sync with color-coding per employee
- **Google Apps Script** — 1,259 lines of spreadsheet automation
- **Twilio WhatsApp API** — conversational messaging
- **AI Models** — Gemini 2.5 Flash with structured output parsers

### Architecture Principles Being Preserved
1. **Deterministic routing over AI orchestration** — Switch/If nodes for state transitions; AI handles NLP only
2. **ONE FLAG PER TURN** — AI agents set one Redis flag per execution to prevent iteration limits
3. **Message batching** — 8-second Redis buffer for split messages
4. **Processing lock** — One execution per user at a time  
5. **Rate limiting** — Per-user throttling
6. **Error handling** — Every AI agent has dedicated error output with user notification + admin alert
7. **Redis session state** — All conversation state in hash per user
8. **Business data cache** — Redis cache refreshed on schedule + on data edit webhook
9. **Dual notifications** — Critical errors via both email and WhatsApp

### What Gets Reused vs. Built New

#### REUSE (~60% of infrastructure)

| Existing Component | Reuse As |
|---|---|
| Redis session state management (userflag pattern) | Lead state tracking per applicant |
| Rate limiter (30 msgs/hr) | Email rate limiting |
| Processing lock (one execution per user) | One processing pipeline per lead |
| Availability checking (AI agent + Google Sheets tools) | Advisor availability checking |
| NEXT_AVAILABLE / specific employee matching | First available qualified advisor matching |
| Alternative slot presentation + user selection flow | Email-based rescheduling alternatives |
| Google Calendar integration (create/update/delete events) | Advisor calendar sync |
| Booking confirmation queue system | Consultation confirmation system |
| Employee Availability sheet + blocked times logic | Advisor Availability + blocked times |
| Weekly Schedule + Default Schedule structure | Advisor Schedule |
| Business Data Cache Refresh workflow | Firm Data Cache Refresh |
| Apps Script (auto-sort, availability sync, calendar sync, snapshot deletion) | Same automations, renamed |
| Error handling pattern (dual notification) | Same |
| Service restriction / qualification logic (allowed employees per service) | Qualified advisors per service tier |
| Contact registration flow | Lead registration flow |
| General Question Agent pattern | Applicant Q&A during booking |
| Daily Archive workflow | Lead archival |
| Intent Router pattern (stateless classification) | Email intent parsing |

#### BUILD NEW (~40%)

| New Component | Complexity |
|---|---|
| React intake form (client-facing) | Medium |
| n8n webhook receiver for form submissions | Low |
| Auto-disqualification rules engine (code node) | Low |
| AI enrichment pipeline (new AI agent, structured output) | Medium |
| React admin dashboard (3-tab view, approve/reject/override) | High |
| n8n API endpoints for dashboard (GET leads, POST actions) | Medium |
| Email outreach engine (replaces WhatsApp sends with Gmail/SMTP) | Medium |
| Email reply processing (inbound email → n8n trigger) | Medium |
| Follow-up cadence (scheduled triggers at 48hr, 96hr, 7d) | Low |
| Rejection/nurture email generation (AI) | Low |
| New Google Sheets tabs (Leads, Firm Configuration, Advisor Info) | Low |
| Dashboard metrics aggregation | Low |

---

## How This Satisfies the Application Requirements

### "Meaningfully expands what a human can do"
The admin goes from manually reading every inquiry, trying to qualify leads with incomplete information, and playing email tag for days — to reviewing AI-enriched profiles and making approve/reject decisions in 30 seconds each. A 3-advisor firm can process 10x more inbound leads without hiring. Leads get responses in minutes instead of days.

**Specific criteria met:**
- **Rebuilding a legacy workflow**: Contact form → email tag → phone screen → maybe schedule = replaced entirely
- **Handling far more complexity/people**: Unlimited concurrent lead processing, parallel advisor matching, automated follow-up sequences
- **Making higher-quality decisions**: AI enrichment gives the admin synthesized profiles, risk flags, and advisor match scores — better information than they ever had before
- **Operating reliably where previously impractical**: Instant disqualification, 24/7 intake processing, automated follow-up cadence that never forgets

### "Clearly define the human's role"
The human is the **client acceptance gatekeeper**. They review AI-enriched applications and make the strategic decision of who to take on as a client. They can override AI auto-rejections. They assign advisors based on factors the AI can't see (relationship dynamics, advisor preference, strategic firm direction). They set the qualification rules. They never touch scheduling logistics, lead qualification analysis, or follow-up emails.

### "Take on real cognitive or operational responsibility"
The AI: analyzes free-text responses for nuance and risk signals, synthesizes multi-dimensional client profiles from raw form data, scores advisor-client fit across specialization/capacity/availability, generates personalized outreach messaging, manages multi-turn email booking conversations with real-time conflict resolution, handles the entire follow-up cadence, and generates appropriate rejection/nurture communications.

### "One critical decision that must remain human — and why"

**Whether to accept a prospective client into the firm.**

This decision must remain human because:
1. **Compounding consequences**: Taking on the wrong client wastes hundreds of advisor hours over years, not just one meeting
2. **Relationship judgment**: An advisor-client personality mismatch leads to churn, bad reviews, and potential compliance issues — the AI can't assess interpersonal fit
3. **Reading between the lines**: Someone who says "aggressive growth" might actually need "help me not panic-sell during a downturn" — this requires human interpretation of stated vs. actual needs
4. **Strategic firm direction**: "Do we want more retirement clients or tax clients this quarter?" is a business strategy decision that changes month to month
5. **Regulatory obligation**: Financial advisors have suitability requirements — a legal duty to only take on clients they can genuinely serve well. Delegating this to AI creates unacceptable liability
6. **The AI makes the decision *possible* at scale, but the human makes the decision *right***: without AI enrichment, the admin doesn't have enough information to decide quickly. Without the human, the AI doesn't have enough judgment to decide correctly. This is the collaboration that defines the system.

### Why Not Just Use Calendly?
Calendly solves scheduling. This system solves qualification + enrichment + human decision-making + personalized outreach + scheduling. Calendly can't: auto-disqualify based on business rules, generate AI client profiles, let an admin approve/reject with enriched context, match advisors by specialization and capacity, personalize outreach messaging, or create a feedback loop where rejected leads receive appropriate nurture communications. Calendly is the last 10% of this pipeline.

---

## Technical Stack Summary

- **n8n** — Workflow orchestration (form webhook, AI processing, email sending, scheduling logic, dashboard API)
- **Redis** — Session state per lead, business data cache, processing locks
- **Google Sheets** — Leads, Advisor Info, Advisor Availability, Appointments, Configuration, Consultation Services
- **Google Calendar** — Advisor consultation calendar
- **Google Apps Script** — Spreadsheet automations (auto-sort, availability sync, calendar sync)
- **Gmail API (via n8n)** — Outreach emails, rejection emails, follow-ups
- **React** — Intake form (client-facing) + Admin dashboard
- **AI** — Gemini 2.5 Flash for enrichment + email parsing; structured output parsers
- **Timezone** — America/Toronto (EST) for a Canadian financial firm context
