# NorthStar Wealth Advisory — AI Pipeline Setup Guide

## System Architecture

```
React Intake Form → [WF1] Validate + Disqualify → [WF2] AI Enrich → [WF3] Availability Check
                                                                              ↓
Admin Dashboard ← [WF4] API Endpoints ← Redis + Sheets (PENDING_REVIEW)
       ↓ Approve                    ↓ Reject              ↓ Override
  [WF5] Email Outreach         [WF8] Rejection Email   [WF2] Re-Enrich
       ↓ Client Replies
  [WF6] Parse Reply → Book / Clarify / Cancel
       ↓ No Reply
  [WF7] Follow-Up Cadence (48h → 96h → 7d Unresponsive)

[WF9] Business Data Cache Refresh (every 6h + on edit webhook)
```

## 9 Workflows — 148 Nodes Total

| # | File | Nodes | Purpose |
|---|------|-------|---------|
| WF1 | WF1_Intake_Auto_Disqualification.json | 26 | Webhook receiver, validation, deterministic disqualification |
| WF2 | WF2_AI_Enrichment.json | 18 | AI profile generation, advisor matching, risk flags |
| WF3 | WF3_Availability_PreCheck.json | 7 | Pre-check preferred/backup time availability |
| WF4 | WF4_Dashboard_API.json | 34 | 6 REST endpoints for admin dashboard |
| WF5 | WF5_Email_Outreach_Booking.json | 18 | Confirmation email + calendar OR scheduling outreach |
| WF6 | WF6_Inbound_Email_Processing.json | 20 | Parse client replies, book/cancel/clarify |
| WF7 | WF7_FollowUp_Cadence.json | 13 | Automated 48h/96h/7d follow-ups |
| WF8 | WF8_Rejection_Email.json | 12 | AI-generated nurture/rejection emails |
| WF9 | WF9_Business_Data_Cache_Refresh.json | 20 | Sheets → Redis cache sync |

## Import Order

1. **WF9** first — sets up Redis cache keys all other workflows depend on
2. **WF1** — entry point for intake form
3. **WF2** — AI enrichment (called by WF1)
4. **WF3** — availability check (called by WF2)
5. **WF4** — dashboard API (calls WF5, WF8, WF2)
6. **WF5** — email outreach (called by WF4)
7. **WF6** — inbound email processing
8. **WF7** — follow-up cadence
9. **WF8** — rejection emails (called by WF4)

## Credentials Needed

Replace all `YOUR_*` placeholders after import:

| Placeholder | Service | Notes |
|-------------|---------|-------|
| `YOUR_GOOGLE_SHEET_ID` | Google Sheets | The NorthStar_Wealth_Advisory_Pipeline spreadsheet ID |
| `YOUR_GOOGLE_SHEETS_CRED_ID` | Google Sheets OAuth2 | Service account or OAuth2 |
| `YOUR_REDIS_CRED_ID` | Redis | Local or cloud Redis instance |
| `YOUR_GMAIL_CRED_ID` | Gmail OAuth2 | Firm's sending email account |
| `YOUR_GEMINI_CRED_ID` | Google Gemini API | For AI enrichment + email parsing |
| `YOUR_GCAL_CRED_ID` | Google Calendar OAuth2 | Advisor calendar access |
| `YOUR_GOOGLE_CALENDAR_ID` | Google Calendar | Primary calendar ID |

## Cross-Workflow References

After importing, update Execute Workflow node IDs:

| In Workflow | Node Name | Points To |
|-------------|-----------|-----------|
| WF1 | Trigger WF2 - Enrichment | WF2 workflow ID |
| WF2 | Trigger WF3 - Availability Check | WF3 workflow ID |
| WF4 | Trigger WF5 - Outreach | WF5 workflow ID |
| WF4 | Trigger WF8 - Rejection Email | WF8 workflow ID |
| WF4 | Trigger WF2 - Re-Enrich | WF2 workflow ID |

## Redis Key Reference

### Lead State (per lead, TTL 30 days)
```
leadstate_{leadId} → Hash
  status, fullName, email, phone, province, investableAssets, annualIncome,
  financialGoals, investmentTimeline, riskTolerance, currentAdvisorSituation,
  preferredDate, preferredTime, backupDate, backupTime, freeText, submittedAt,
  profileSummary, recommendedServiceTier, advisorMatchRanking, riskFlags,
  conversationStarters, priorityScore, availabilityStatus, suggestedBooking,
  assignedAdvisorId, assignedAdvisorName, approvedAt, rejectedAt,
  outreachSentAt, lastEmailSentAt, pendingSlots, followUpCount,
  bookedAt, appointmentDatetime, calendarEventId
```

### Business Cache (TTL 24h, refreshed by WF9)
```
firm:advisors          → JSON array of advisor objects
firm:service_tiers     → JSON array of service tier objects
firm:advisor_availability → JSON array of availability rows
firm:config            → JSON object of all Configuration tab key-values
firm:email_templates   → JSON object keyed by templateKey
```

## Lead State Machine

```
SUBMITTED → PENDING_ENRICHMENT → ENRICHING → PENDING_REVIEW
                                                    │
                ┌──────────────────────────────────┤
                │                  │                │
             REJECTED       AWAITING_INFO      APPROVED
                │                  │                │
                └─(end)            │      OUTREACH_IN_PROGRESS
                                   │                │
                                   └───────┐  ┌────┴────────┐
                                           │  │             │
                                        BOOKED    CANCELLED_BY_LEAD
                                           │
                                        COMPLETED
                                        
DISQUALIFIED ──[admin override]──→ PENDING_ENRICHMENT
OUTREACH_IN_PROGRESS ──[7d timeout]──→ UNRESPONSIVE
```

## Dashboard API Endpoints (WF4)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/webhook/api/leads?tab=pending` | List leads by tab (pending/auto_rejected/active) |
| POST | `/webhook/api/leads/approve` | Approve lead `{leadId, assignedAdvisorId?}` |
| POST | `/webhook/api/leads/reject` | Reject lead `{leadId, rejectionReason}` |
| POST | `/webhook/api/leads/override` | Override disqualification `{leadId, overrideReason}` |
| POST | `/webhook/api/leads/request-info` | Request more info `{leadId, followUpQuestion}` |
| GET | `/webhook/api/metrics` | Dashboard aggregate metrics |

## Google Sheets Tab Reference

Use the provided `NorthStar_Wealth_Advisory_Pipeline.xlsx` — it contains:
- **Leads** — 37 columns, pre-populated with 8 sample leads in various states
- **Advisor Info** — 4 advisors with specializations and caseloads
- **Advisor Availability** — 14 days of schedule data
- **Appointments** — 3 sample appointments
- **Configuration** — 20 key-value pairs (firm settings, thresholds, hours)
- **Consultation Services** — 3 service tiers
- **Email Templates** — 7 templates for all email types
- **System Log** — Sample log entries
- **Error Log** — Sample error entries

## Testing Checklist

### WF9 (Cache Refresh)
- [ ] Manual trigger loads all 5 Redis keys
- [ ] Verify `firm:config` contains served_provinces, min_assets_threshold
- [ ] Verify `firm:advisors` parses specializations into arrays

### WF1 (Intake)
- [ ] Valid submission → 200 response + lead in Sheets as PENDING_ENRICHMENT
- [ ] Missing required field → 400 response
- [ ] Province = "SK" (not served) → DISQUALIFIED + rejection email sent
- [ ] Assets = "under_25k" → DISQUALIFIED + rejection email sent
- [ ] Weekend date → 400 validation error

### WF2 (Enrichment)
- [ ] Generates profileSummary, advisorMatchRanking, riskFlags, priorityScore
- [ ] Structured output parses correctly
- [ ] Updates both Redis and Sheets

### WF4 (Dashboard API)
- [ ] GET /api/leads?tab=pending returns PENDING_REVIEW leads sorted by priority
- [ ] POST /approve triggers WF5
- [ ] POST /reject triggers WF8
- [ ] POST /override re-triggers WF2

### WF5 (Outreach)
- [ ] Available time → confirmation email + calendar event + BOOKED
- [ ] Scheduling required → outreach email with 4 slot options

### WF6 (Inbound Email)
- [ ] "Option 1" reply → books slot 1
- [ ] "Never mind" → cancels, sends ack
- [ ] "How long is the meeting?" → answers + re-prompts for scheduling

### WF7 (Follow-Up)
- [ ] 48h+ with followUpCount=0 → sends follow-up #1
- [ ] 168h+ with followUpCount=2 → marks UNRESPONSIVE
