# PROMPT: Build Frontend for AI Client Intake & Qualification Pipeline

## What You're Building

Two React applications for a financial advisory firm's AI-powered client intake system:
1. **Client Intake Form** — public-facing form where prospective clients submit their information
2. **Admin Dashboard** — internal tool where firm admin reviews AI-enriched applications and takes action

Both apps communicate with an n8n backend via webhook endpoints. Use modern React with hooks, Tailwind CSS for styling, and a clean professional financial services aesthetic (think: Wealthsimple's design language — minimal, confident, lots of whitespace, dark navy / white / green accents).

---

## App 1: Client Intake Form

### Design
- Single-page form, responsive (mobile-first)
- Clean, trustworthy, premium feel — this is a financial services firm
- Progress indicator showing form sections
- Firm logo/name at top
- Color palette: Navy (#1A2B4A), White, Accent green (#2DC672), Light gray (#F5F7FA) backgrounds
- Font: Inter or similar clean sans-serif

### Form Sections (multi-step or single scroll — your choice, but multi-step feels more premium)

**Section 1: Personal Information**
- Full Name (text input, required)
- Email (email input, required, validated)
- Phone Number (tel input, required, formatted)
- Province/State of Residence (dropdown, required)
  - Options: All Canadian provinces + territories (Ontario, British Columbia, Alberta, Quebec, etc.)

**Section 2: Financial Profile**
- Investable Assets Range (dropdown, required)
  - Under $25,000
  - $25,000 – $100,000
  - $100,000 – $250,000
  - $250,000 – $500,000
  - $500,000 – $1,000,000
  - $1,000,000+
- Annual Household Income Range (dropdown, required)
  - Under $50,000
  - $50,000 – $100,000
  - $100,000 – $200,000
  - $200,000 – $500,000
  - $500,000+
- Primary Financial Goal(s) (multi-select checkboxes, at least 1 required)
  - Retirement Planning
  - Wealth Growth & Accumulation
  - Tax Optimization
  - Estate Planning
  - Debt Management
  - Education Savings (RESP)

**Section 3: Investment Preferences**
- Investment Timeline (radio buttons, required)
  - Less than 1 year
  - 1–3 years
  - 3–5 years
  - 5–10 years
  - 10+ years
- Risk Tolerance (visual slider or 3-option radio with descriptions, required)
  - Conservative: "Preserve what I have. I'm okay with lower returns for stability."
  - Moderate: "Balanced approach. Some risk for growth, but protect the downside."
  - Aggressive: "Maximize growth. I can handle significant short-term volatility."
- Current Advisor Situation (radio, required)
  - I currently have a financial advisor and I'm considering switching
  - I've never worked with a financial advisor
  - I previously had an advisor but don't currently

**Section 4: Consultation Scheduling**
- Preferred Date (date picker, required, minimum = tomorrow, max = 30 days out, weekdays only)
- Preferred Time (time picker or dropdown in 30-min intervals, required, 9:00 AM – 5:00 PM only)
- Backup Date (date picker, optional, same constraints)
- Backup Time (time picker, optional, same constraints)

**Section 5: Additional Context**
- Free-text textarea: "Is there anything else we should know about your financial situation or goals?" (optional, max 1000 chars, show character count)
- Consent checkbox (required): "I consent to being contacted by [Firm Name] regarding financial advisory services. I understand my information will be processed in accordance with our Privacy Policy."

### Submission Behavior
- On submit: POST JSON to configurable webhook URL (environment variable)
- Show loading state with spinner
- On success: redirect to a thank-you page: "Thank you, [Name]. We've received your information and will be in touch within 1 business day. If your preferred time is available, we'll confirm your consultation right away."
- On error: show inline error message, don't clear form

### Webhook Payload Structure
```json
{
  "leadId": "LEAD-{timestamp}-{random6chars}",
  "submittedAt": "2026-02-23T14:30:00-05:00",
  "name": "Sarah Chen",
  "email": "sarah@example.com",
  "phone": "+14165551234",
  "province": "Ontario",
  "investableAssets": "$250,000 – $500,000",
  "annualIncome": "$100,000 – $200,000",
  "primaryGoals": ["Retirement Planning", "Tax Optimization"],
  "investmentTimeline": "5-10 years",
  "riskTolerance": "Moderate",
  "currentAdvisorSituation": "switching",
  "preferredDate": "2026-02-27",
  "preferredTime": "14:00",
  "backupDate": "2026-02-28",
  "backupTime": "10:00",
  "freeTextNotes": "Recently received an inheritance and not sure how to invest it.",
  "consentGiven": true
}
```

---

## App 2: Admin Dashboard

### Design
- Full-width layout, sidebar navigation
- Professional, data-dense but clean — think: Wealthsimple's internal tools aesthetic
- Same color palette as intake form
- Responsive but optimized for desktop (this is an internal tool)
- Header with firm logo, admin name, notification bell

### Authentication
- For the prototype: simple hardcoded login (username/password in env vars) or skip auth entirely with a note that production would use OAuth. Don't spend time building real auth.

### Sidebar Navigation
- 📋 Pending Review (with count badge)
- ❌ Auto-Rejected (with count badge)
- ✅ Active & Completed
- 📊 Metrics (stretch goal)
- ⚙️ Settings (placeholder)

### Top Metrics Bar (always visible)
- Leads This Week: [count]
- Pending Review: [count]
- Booked Consultations: [count]
- Avg. Time to Book: [duration]

These can be static/mocked for the prototype or pulled from the API.

### Tab 1: Pending Review

List of lead cards, sorted by Priority Score (HIGH first), then by submission date.

**Each card (collapsed state) shows:**
- Priority badge: HIGH (red/coral), MEDIUM (amber), LOW (green)
- Client name
- Investable assets range
- Primary goal(s)
- Suggested advisor name
- Preferred time availability indicator: "✅ Available" or "⚠️ Scheduling needed"
- Time since submission: "2 hours ago", "1 day ago"

**Each card (expanded state) adds:**
- AI Profile Summary (the 3-4 sentence narrative) — prominently displayed
- Recommended Service Tier
- Risk Flags (highlighted in amber/red callout boxes)
- Advisor Match Ranking (top 2-3 with reasoning)
- Conversation Starters (bulleted list)
- Preferred & backup times with availability status
- Raw form data (collapsible section)

**Action buttons (always visible on card):**
- **✅ Approve** — Opens a small modal:
  - Assigned Advisor: dropdown pre-filled with AI's suggestion, can override
  - If preferred time available: shows "Consultation will be booked for [date/time] with [advisor]"
  - If not available: shows "Email outreach will begin to find a suitable time"
  - Confirm button
- **❌ Reject** — Opens modal:
  - Reason dropdown: "Below our minimum threshold" / "Not a good fit for our services" / "Incomplete or unclear information" / "Other"
  - Optional note text field
  - Confirm button
- **❓ Request More Info** — Opens modal:
  - Text field: "What would you like to ask?"
  - Send button
- **🔄 Override to Approve** (only on Auto-Rejected tab)

**On Approve action:** POST to n8n webhook:
```json
{
  "action": "approve",
  "leadId": "LEAD-xxx",
  "assignedAdvisorId": "ADV001",
  "assignedAdvisorName": "James Wilson",
  "reviewedBy": "Admin",
  "notes": ""
}
```

**On Reject action:** POST to n8n webhook:
```json
{
  "action": "reject",
  "leadId": "LEAD-xxx",
  "reason": "Below our minimum threshold",
  "reviewedBy": "Admin",
  "notes": "Mentioned crypto trading interest — not aligned with our services"
}
```

### Tab 2: Auto-Rejected

Same card format as Pending Review, but:
- Disqualification reason prominently shown (red banner): "Auto-rejected: Jurisdiction not served (Northwest Territories)"
- Has **🔄 Override** button that moves to Pending Review
- Lower visual priority (gray-toned cards)

### Tab 3: Active & Completed

Sub-tabs or filter chips:
- **Outreach In Progress**: approved, AI is emailing to schedule
- **Booked**: consultation confirmed, showing date/time/advisor
- **Unresponsive**: no reply after follow-up sequence
- **Completed**: consultation happened (manual status update)

Each entry shows: client name, advisor, status, last activity timestamp, consultation date (if booked).

### Dashboard API Endpoints (n8n webhooks it calls)

The dashboard communicates with n8n via these webhook endpoints:

```
GET  /api/leads?status=pending_review     → Returns pending leads with AI enrichment
GET  /api/leads?status=disqualified       → Returns auto-rejected leads
GET  /api/leads?status=approved           → Returns active/completed leads
POST /api/leads/{leadId}/approve          → Approve a lead
POST /api/leads/{leadId}/reject           → Reject a lead
POST /api/leads/{leadId}/request-info     → Send follow-up question
POST /api/leads/{leadId}/override         → Override auto-rejection
GET  /api/metrics                         → Dashboard metrics
```

For the prototype, these can use n8n webhook URLs directly. Include a `.env` config for the base URL.

### Sample Data

Pre-populate the dashboard with 8-10 sample leads for demo purposes:

**HIGH priority examples:**
- Sarah Chen, Ontario, $500K-$1M, Retirement + Tax, switching advisors, "just sold my business"
- Michael Torres, British Columbia, $1M+, Estate Planning, first-time, "parents passed recently, large inheritance"

**MEDIUM priority examples:**
- Priya Patel, Alberta, $250K-$500K, Wealth Growth, never had advisor, moderate risk
- David Kim, Ontario, $100K-$250K, Retirement + Education, switching, 10+ year timeline

**LOW priority examples:**
- Emma Walsh, Quebec, $100K-$250K, Debt Management + Wealth Growth, never had advisor, conservative

**Auto-rejected examples:**
- James Liu, Northwest Territories (jurisdiction not served)
- Alex Morgan, Ontario, Under $25K (below minimum) — but free text says "expecting $300K inheritance this quarter" (good override test case)
- Fatima Al-Rashid, Manitoba, $50K-$100K (below minimum)

---

## Technical Requirements

- **React 18+** with hooks (functional components only)
- **Tailwind CSS** for styling (no component libraries — raw Tailwind for full control)
- **React Router** for navigation (dashboard)
- Both apps in a single repo with shared components where logical
- Use **fetch** for API calls (no axios)
- Environment variables for all URLs and configuration
- Include a `README.md` with setup instructions
- TypeScript preferred but not required
- Static sample data fallback if API is unreachable (for demo purposes)

### Project Structure
```
/client-intake-form
  /src
    /components
    /pages
    App.jsx
    main.jsx
  index.html
  package.json

/admin-dashboard
  /src
    /components
    /pages
    /hooks
    /utils
    /data (sample data)
    App.jsx
    main.jsx
  index.html
  package.json
```

### Key UX Details

**Intake Form:**
- Smooth transitions between form sections
- Inline validation (email format, phone format, required fields)
- Date picker should disable past dates, weekends, and show a clean calendar UI
- Time picker should only show business hours in 30-min increments
- Mobile-optimized: large touch targets, no tiny dropdowns

**Admin Dashboard:**
- Cards should be instantly scannable — priority and key info visible without expanding
- Approve/Reject should be 2-click max (button → confirm)
- Loading states for all API calls
- Optimistic UI updates (card moves to new tab immediately, rolls back on error)
- Keyboard shortcuts (stretch): Enter to approve, Esc to cancel

---

## What This Is For

This is a prototype for a job application demonstrating an AI system that meaningfully expands what a human can do. The frontend must look polished and professional — this is part of the impression. It doesn't need to be production-hardened, but it needs to look like it could be. Focus on design quality over feature completeness.

The core story the frontend tells: an admin opens the dashboard, sees AI-enriched lead cards with profile summaries, risk flags, and advisor match scores, and makes fast accept/reject decisions with full context. That experience needs to feel real and impressive.
