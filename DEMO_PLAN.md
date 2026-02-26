# NorthStar Wealth Advisory — Demo Plan & Video Strategy

**Application:** Wealthsimple AI Builder Role
**Deadline:** Monday, March 2, 11:59 PM EST
**Deliverables:** 2–3 min demo video, 500-word written explanation, salary expectations

---

## Key Questions Answered

### Is the booking back-and-forth fully automated?

**Yes, fully automated once the admin clicks Approve.**

1. **Admin approves** → WF4 triggers WF5
2. **WF5 checks availability** → If preferred time works: sends confirmation email + creates Google Calendar event + marks BOOKED. If not: finds alternative slots, sends scheduling outreach email with numbered options, marks OUTREACH_IN_PROGRESS
3. **Client replies** → WF6's Gmail trigger picks up the reply every minute, AI parser classifies intent (selected slot / suggest alternative / cancel / question / unclear), then a Switch node routes deterministically to the right action
4. **No reply** → WF7 runs hourly, sends follow-up #1 at 48h, #2 at 96h, marks UNRESPONSIVE at 7 days

The human is only involved at step 1 (the approve decision). Everything after is automated.

### Are rejection emails automated? Dynamic or fixed?

**Triggered by the admin, but email content is AI-generated (dynamic).** WF8 uses a Gemini agent with a system prompt constrained by rejection type (below_threshold, not_a_fit, incomplete_info, other). It personalizes tone and includes relevant resources based on the client's goals.

There IS a hardcoded fallback template in WF8 that fires if the AI agent errors out.

**Liability consideration:** In production you'd likely use AI to *draft* and have a human review queue before sending, or switch to templates entirely. This is a great candidate for the "what would break first at scale" section of the written explanation — which is literally one of the 4 things Wealthsimple asks you to cover.

**For the demo:** Show the AI-generated version — it's more impressive. It tailors resource links to client goals (retirement → calculator, tax → CRA) and follows strict guardrails (120 words max, no mention of AI/scoring, first name only).

---

## Video Structure — 5 Segments (~2.5 Minutes)

### Segment 1: The Hook + Architecture (30 sec)

- Quick slide or voiceover: *"One advisor, 50 incoming leads per week. Here's how AI handles everything except the one decision that matters."*
- Flash the system architecture diagram
- Name the human decision: **accept/reject stays human** because of legal suitability obligations + relationship mismatch risk
- Briefly show the 9-workflow map (WF1–WF9)

### Segment 2: Intake + Auto-Disqualification (30 sec)

- Submit 2 forms live:
  - One from **Saskatchewan** (unsupported province) → instant DISQUALIFIED
  - One valid from **Ontario** → passes through
- Show: form submission → n8n execution log → Airtable record updates in real-time
- **Key message:** *"Deterministic rules, no AI — you don't want AI deciding who gets rejected at the gate"*

### Segment 3: AI Enrichment — The Money Shot (40 sec)

- Show the Ontario lead flowing through WF2
- Pull up the dashboard card showing:
  - Profile summary (3–4 sentence advisor briefing)
  - Advisor match ranking with scores and reasoning
  - Risk flags (e.g., "switching advisor → ask about pain points")
  - Conversation starters
  - Priority score (HIGH / MEDIUM / LOW)
- Show two contrasting leads: a HIGH priority $500K+ inheritance case vs. a LOW priority routine case
- **Key message:** *"AI does the 20 minutes of research an advisor would do manually — reading between the lines, matching to the right specialist"*

### Segment 4: The Human Decision + Automated Outreach (30 sec)

- Click **Approve** on the dashboard
- Show: email arrives in client inbox with confirmation OR scheduling options
- If time: show a reply ("Option 2 works") → WF6 parses it → booking confirmed → calendar event created
- **Key message:** *"After the human says yes, everything else is hands-free"*

### Segment 5: Follow-Up + Rejection (20 sec)

- Briefly show: follow-up cadence (48h → 96h → unresponsive)
- Show one rejection: admin clicks reject with reason "below_threshold" → personalized nurture email with resources sent
- Close with: **"9 workflows, 148 nodes, one human decision"**

---

## Build Priority (Ranked by Demo Impact)

Given the March 2 deadline, focus in this order:

| Priority | What | Why | Effort |
|----------|------|-----|--------|
| **1** | Intake form + WF1 disqualification | Live demo foundation — must work end-to-end | Medium |
| **2** | WF2 AI enrichment | Most impressive AI feature — this is the "money shot" | Medium |
| **3** | Dashboard displaying enrichment data | Doesn't need to be fully functional, just display AI-generated cards convincingly | Medium |
| **4** | WF5 email send (confirmation or outreach) | Real email arriving in an inbox is high visual impact | Low |
| **5** | WF6 / WF7 / WF8 | Narrate over n8n execution logs or show pre-seeded results | Low |

**Strategy:** Show 2–3 things working live and narrate the rest. Wealthsimple is evaluating *judgment and system design*, not whether every node is bug-free.

---

## Written Explanation Outline (500 words)

The 4 required topics from the application:

1. **What the human can now do that they couldn't before**
   - One advisor can intake, qualify, enrich, and schedule 50+ leads/week instead of 5–10
   - AI handles the research (profile generation, advisor matching, risk detection) that used to take 20 min per lead manually
   - Follow-up cadence runs 24/7 without human attention

2. **What AI is responsible for**
   - Enrichment: profile summary, advisor matching, risk flag detection, priority scoring, conversation starters
   - Email parsing: classifying client replies into actionable intents (book / cancel / question / unclear)
   - Scheduling: finding available slots, generating outreach emails, processing replies
   - Follow-up: automated escalation cadence (48h → 96h → 7d)

3. **Where AI must stop**
   - **The accept/reject decision must remain human.** Taking on the wrong client wastes hundreds of advisor hours over years. Advisor-client personality mismatch creates compliance risk. The decision requires reading between the lines of stated vs. actual needs. It involves firm strategy (what type of clients to pursue this quarter). Financial advisors have legal suitability obligations.
   - Disqualification at intake is deterministic code, not AI — jurisdiction, asset minimum, goal mismatch are hard rules
   - Rejection emails (in production) would have a human review queue

4. **What would break first at scale**
   - AI-generated rejection emails are the highest-risk surface — hallucination in a client-facing financial communication is a liability. Production fix: template-based with AI-selected variables, or AI draft → human approve queue
   - Email reply parsing accuracy — "Option 2" is easy, but ambiguous replies ("maybe next week?") will need human escalation paths
   - Single Redis instance as state store — would need clustering or migration to a proper state machine service
   - Rate limiting on Gemini API calls during intake spikes

---

## System Quick Reference

```
React Intake Form → [WF1] Validate + Disqualify → [WF2] AI Enrich → [WF3] Availability Check
                                                                              ↓
Admin Dashboard ← [WF4] API Endpoints ← Airtable + Redis (PENDING_REVIEW)
       ↓ Approve                    ↓ Reject              ↓ Override
  [WF5] Email Outreach         [WF8] Rejection Email   [WF2] Re-Enrich
       ↓ Client Replies
  [WF6] Parse Reply → Book / Clarify / Cancel
       ↓ No Reply
  [WF7] Follow-Up Cadence (48h → 96h → 7d → Unresponsive)

[WF9] Business Data Cache Refresh (Airtable → Redis, every 6h)
```

**9 workflows — 148 nodes — 17 AI agents — 1 human decision**
