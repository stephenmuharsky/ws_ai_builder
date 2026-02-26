# Backend-to-Frontend Wiring Guide (Airtable Edition)

> **Audience:** Desktop Claude instance (the architect) that has all n8n workflow JSONs in context.
> **Goal:** Wire the n8n backend + Airtable to both React frontends so that form submissions flow through the pipeline and appear live on the admin dashboard.

---

## Architecture Change: Google Sheets → Airtable

The frontends have been updated to use **Airtable as the primary data store** instead of Google Sheets.

**What changed:**
- **Dashboard READS directly from Airtable** — no middleman, no WF4 for GET requests
- **Dashboard WRITES still go through n8n** — approve/reject/override/request-info still call n8n webhooks because they trigger downstream workflows (email outreach, AI enrichment, calendar booking)
- **WF1 still receives form submissions** — runs disqualification rules, writes to Airtable + Redis, triggers pipeline
- **All other workflows (WF2-WF9)** must be updated to write to Airtable instead of Google Sheets
- **WF4 is simplified** — only needs the 4 POST action endpoints (approve, reject, override, request-info). The 2 GET endpoints (leads, metrics) are now handled by the dashboard reading Airtable directly
- **WF9 (Cache Refresh)** still reads business config into Redis, but now from Airtable instead of Sheets

```
CLIENT INTAKE FORM (React, port 5173)
        │
        │  POST /webhook/intake-form
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  n8n (port 5678)                                                 │
│                                                                  │
│  WF1 → validates, disqualifies, writes to Airtable + Redis      │
│  WF2 → AI enrichment, writes to Airtable + Redis                │
│  WF3 → availability pre-check, writes to Airtable + Redis       │
│  WF4 → 4 POST webhook endpoints (approve/reject/override/info)  │
│  WF5-WF8 → email outreach, follow-ups, rejections               │
│  WF9 → Airtable → Redis cache refresh                           │
│                                                                  │
│  All WFs read/write Airtable via n8n Airtable node               │
└──────────┬───────────────────────────────────────────────────────┘
           │ writes to
           ▼
┌──────────────────────┐
│  AIRTABLE BASE       │◄──── Dashboard reads directly via REST API
│                      │
│  Tables:             │
│  - Leads (37 fields) │
│  - Advisor Info      │
│  - Advisor Avail.    │
│  - Appointments      │
│  - Configuration     │
│  - Consultation Svcs │
│  - Email Templates   │
│  - System Log        │
│  - Error Log         │
└──────────────────────┘
           ▲
           │ reads directly (Airtable REST API)
           │
    ADMIN DASHBOARD (React, port 5174)
        reads:  Airtable REST API (leads, metrics, advisors)
        writes: n8n webhooks (approve, reject, override, request-info)
```

---

## Part 1: Airtable Base Setup

### 1.1 Create the Airtable Base from the .xlsx Template

1. Go to Airtable → Create new base → Import from file → Upload `NorthStar_Wealth_Advisory_Pipeline.xlsx`
2. Airtable will auto-create tables matching the 9 sheet tabs
3. Rename the base to **"NorthStar Wealth Advisory Pipeline"**
4. Copy the **Base ID** from the URL: `https://airtable.com/app{THIS_PART}/...` (starts with `app`)

### 1.2 Create a Personal Access Token

1. Go to https://airtable.com/create/tokens
2. Create a token with scopes:
   - `data.records:read` — for dashboard reads
   - `data.records:write` — for n8n writes
3. Grant access to your NorthStar base
4. Copy the token (starts with `pat`)

### 1.3 Configure Field Types in Airtable

After import, set the correct field types for better data integrity:

**Leads table — field type recommendations:**

| Field | Airtable Type | Notes |
|-------|--------------|-------|
| leadId | Single line text | Primary field |
| fullName | Single line text | |
| email | Email | |
| phone | Phone | |
| province | Single select | Options: ON, BC, AB, QC, MB, SK, NS, NB, NL, PE, NT, YT, NU |
| investableAssets | Single select | Options: under_25k, 25k_100k, 100k_250k, 250k_500k, 500k_1m, 1m_plus |
| annualIncome | Single select | Options: under_50k, 50k_100k, 100k_200k, 200k_500k, 500k_plus |
| financialGoals | Long text | **Keep as comma-separated string** (not Multiple Select) — the dashboard expects a comma-separated string. n8n writes `"retirement_planning,tax_optimization"` |
| investmentTimeline | Single select | Options: under_1yr, 1_3yr, 3_5yr, 5_10yr, 10_plus |
| riskTolerance | Single select | Options: conservative, moderate, aggressive |
| currentAdvisorSituation | Single select | Options: switching, never_had, previously_had |
| preferredDate | Date | |
| preferredTime | Single line text | HH:MM format |
| backupDate | Date | |
| backupTime | Single line text | HH:MM format |
| freeText | Long text | |
| status | Single select | Options: PENDING_ENRICHMENT, PENDING_REVIEW, APPROVED, REJECTED, DISQUALIFIED, OUTREACH_IN_PROGRESS, BOOKED, COMPLETED, UNRESPONSIVE, CANCELLED_BY_LEAD, AWAITING_INFO |
| disqualificationReason | Single line text | |
| priorityScore | Single select | Options: HIGH, MEDIUM, LOW |
| profileSummary | Long text | AI-generated narrative |
| recommendedServiceTier | Long text | **JSON string** — stored as `'{"tierId":"T2","tierName":"Wealth Management","reasoning":"..."}'` |
| advisorMatchRanking | Long text | **JSON string** — stored as `'[{"advisorId":"ADV001","advisorName":"...","matchScore":92,"reasoning":"..."}]'` |
| riskFlags | Long text | **JSON string** — stored as `'[{"flag":"...","detail":"...","severity":"HIGH"}]'` |
| conversationStarters | Long text | **JSON string** — stored as `'["starter 1","starter 2","starter 3"]'` |
| suggestedBooking | Long text | **JSON string** — `'{"advisorId":"ADV001","date":"2026-02-27","time":"14:00"}'` or empty |
| availabilityStatus | Single select | Options: PREFERRED_AVAILABLE, BACKUP_AVAILABLE, SCHEDULING_REQUIRED |
| assignedAdvisorId | Single line text | |
| assignedAdvisorName | Single line text | |
| bookedAt | Single line text | ISO8601 timestamp string |
| appointmentDatetime | Single line text | ISO8601 timestamp string |
| calendarEventId | Single line text | |
| submittedAt | Single line text | ISO8601 timestamp string |
| approvedAt | Single line text | ISO8601 timestamp string |
| rejectedAt | Single line text | ISO8601 timestamp string |
| rejectionReason | Single line text | |
| followUpCount | Number (integer) | |
| lastEmailSentAt | Single line text | ISO8601 timestamp string |
| overrideReason | Long text | |
| priorityReasoning | Long text | |

> **Critical: JSON fields must stay as Long Text, NOT converted to other types.** The dashboard's `safeJsonParse()` function parses these strings. n8n must `JSON.stringify()` the objects before writing them to Airtable.

> **Critical: financialGoals must be a comma-separated string in Long Text**, NOT a Multiple Select field. The dashboard's `parseGoals()` function splits by comma. If you use Multiple Select, the Airtable API returns an array which the dashboard's normalization layer (`airtable.js`) will join back to a comma-separated string — but it's cleaner to keep it as a string from the start.

**Advisor Info table:**

| Field | Type |
|-------|------|
| advisorId | Single line text (primary) |
| advisorName | Single line text |
| email | Email |
| calendarEmail | Email |
| specializations | Long text (comma-separated) |
| currentCaseload | Number |
| maxCapacity | Number |
| bio | Long text |

**Other tables** — keep the same structure as the xlsx import. See Part 1.2 of the original guide for full column specs.

---

## Part 2: Frontend Configuration

### Admin Dashboard `.env`

```env
# Airtable (primary data source for reads)
VITE_AIRTABLE_PAT=pat_your_token_here
VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
VITE_AIRTABLE_LEADS_TABLE=Leads
VITE_AIRTABLE_ADVISORS_TABLE=Advisor Info

# n8n (write operations trigger downstream workflows)
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Branding
VITE_FIRM_NAME=NorthStar Wealth Advisory
```

### Client Intake Form `.env`

```env
# n8n webhook (form submissions go through WF1 for processing)
VITE_WEBHOOK_URL=http://localhost:5678/webhook/intake-form

# Branding
VITE_FIRM_NAME=NorthStar Wealth Advisory
VITE_FIRM_PHONE=+1 (416) 555-0190
VITE_FIRM_EMAIL=hello@northstarwealth.ca
```

### How the Dashboard Data Layer Works (Updated Code)

The dashboard now has a 3-tier data strategy:

```
Priority 1: Airtable REST API  (if VITE_AIRTABLE_PAT + VITE_AIRTABLE_BASE_ID are set)
Priority 2: n8n WF4 endpoints   (fallback if Airtable not configured)
Priority 3: Sample data          (fallback if both are unreachable)
```

**New files created:**
- `admin-dashboard/src/utils/airtable.js` — Airtable REST API client
  - `fetchLeadsFromAirtable(tab)` — filters by status, sorts by priority, handles pagination
  - `fetchMetricsFromAirtable()` — calculates metrics from Leads table
  - `fetchAdvisorsFromAirtable()` — loads advisor list for ApproveModal
  - `isAirtableConfigured()` — checks if PAT + base ID are set

**Modified files:**
- `admin-dashboard/src/utils/api.js` — routes reads to Airtable, writes to n8n
- `admin-dashboard/src/hooks/useAdvisors.js` — new hook for Airtable advisor data
- `admin-dashboard/src/components/ApproveModal.jsx` — uses `useAdvisors()` instead of hardcoded `sampleAdvisors`

**The normalization layer in `airtable.js` handles:**
- Flattening Airtable's `{ id, fields: {...} }` record shape into flat lead objects
- Converting `financialGoals` array (if Airtable returns one) back to comma-separated string
- Passing JSON string fields through as-is (dashboard's `safeJsonParse()` handles parsing)
- Client-side priority sorting (Airtable's alphabetical sort would put HIGH < LOW < MEDIUM)

---

## Part 3: Wiring the Client Intake Form → WF1

**No changes to the intake form.** It still POSTs to `VITE_WEBHOOK_URL` (n8n WF1 webhook).

### What the form sends

```json
{
  "fullName": "Sarah Chen",
  "email": "sarah.chen@gmail.com",
  "phone": "4165551234",
  "province": "ON",
  "investableAssets": "500k_1m",
  "annualIncome": "200k_500k",
  "financialGoals": ["retirement_planning", "tax_optimization"],
  "investmentTimeline": "5_10yr",
  "riskTolerance": "moderate",
  "currentAdvisorSituation": "switching",
  "preferredDate": "2026-02-25",
  "preferredTime": "14:00",
  "backupDate": "2026-02-26",
  "backupTime": "10:00",
  "freeText": "Currently with TD Wealth...",
  "consentGiven": true
}
```

**Notes:**
- `phone` is digits-only (form strips formatting)
- `email` is lowercased
- `financialGoals` is an **array** — WF1 must join to comma-separated string before writing to Airtable
- Optional fields (`backupDate`, `backupTime`, `freeText`) may be absent

### What WF1 must do (updated for Airtable)

1. **Generate leadId:** `LEAD-YYYYMMDD-XXXX` (4 random digits)
2. **Set submittedAt:** ISO8601 timestamp with timezone
3. **Set initial status:** `PENDING_ENRICHMENT`
4. **Convert financialGoals array to comma-separated string:** `"retirement_planning,tax_optimization"`
5. **Run disqualification rules** (same 3 rules — see below)
6. **Write to Airtable** "Leads" table (create record with all fields)
7. **Write to Redis** hash `leadstate_{leadId}` with 30-day TTL
8. **Return HTTP 200** `{"success": true, "leadId": "LEAD-..."}` to the form

### WF1 Disqualification Rules (unchanged)

Load config from Redis (`firm:config`), then check in order:

**Rule 1 — Jurisdiction:**
```
IF province NOT IN firm:config.served_provinces → DISQUALIFIED, reason: "jurisdiction_not_served"
```

**Rule 2 — Minimum Assets:**
```
Asset value map:
  under_25k   → 12500
  25k_100k    → 62500
  100k_250k   → 175000
  250k_500k   → 375000
  500k_1m     → 750000
  1m_plus     → 1500000

IF mapped_value < firm:config.min_assets_threshold → DISQUALIFIED, reason: "below_asset_threshold"
```

**Rule 3 — Goal Mismatch:**
```
IF no overlap between financialGoals and firm:config.offered_goal_types → DISQUALIFIED, reason: "goal_mismatch"
```

---

## Part 4: Wiring n8n WF4 (Action Endpoints) → Admin Dashboard

### WF4 is now SIMPLIFIED — only 4 POST endpoints needed

The dashboard reads from Airtable directly, so WF4 no longer needs the GET endpoints. It only needs the 4 action webhooks that trigger downstream workflows.

**CORS:** Every endpoint must still return:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Endpoint 1: `POST /api/leads/approve`

**Dashboard sends:**
```json
{
  "leadId": "LEAD-20260220-1001",
  "assignedAdvisorId": "ADV001",
  "assignedAdvisorName": "Michael Torres"
}
```

**WF4 must:**
1. Find the lead record in Airtable by `leadId` (use `filterByFormula={leadId}='LEAD-...'`)
2. Update the record:
   - `status` → `"APPROVED"`
   - `assignedAdvisorId` → from request
   - `assignedAdvisorName` → from request
   - `approvedAt` → current ISO8601 timestamp
3. Update Redis hash `leadstate_{leadId}`
4. Trigger **WF5** (Email Outreach) passing: `leadId`, `assignedAdvisorId`, `availabilityStatus`, `suggestedBooking`
5. Return `{"success": true, "leadId": "...", "status": "APPROVED"}`

### Endpoint 2: `POST /api/leads/reject`

**Dashboard sends:**
```json
{
  "leadId": "LEAD-20260220-1003",
  "rejectionReason": "Below our minimum threshold",
  "customNote": "optional note"
}
```

**WF4 must:**
1. Find lead in Airtable by `leadId`
2. Update: `status` → `"REJECTED"`, `rejectionReason`, `rejectedAt`
3. Update Redis
4. Trigger **WF8** (Rejection Email)
5. Return `{"success": true, "leadId": "...", "status": "REJECTED"}`

### Endpoint 3: `POST /api/leads/override`

**Dashboard sends:**
```json
{
  "leadId": "LEAD-20260220-1006",
  "overrideReason": "Mentioned inheritance in free text"
}
```

**WF4 must:**
1. Find lead in Airtable by `leadId`
2. Update: `status` → `"PENDING_ENRICHMENT"`, clear `disqualificationReason`, set `overrideReason`
3. Update Redis
4. Trigger **WF2** (AI Enrichment) to re-enrich
5. Return `{"success": true, "leadId": "...", "status": "PENDING_ENRICHMENT"}`

### Endpoint 4: `POST /api/leads/request-info`

**Dashboard sends:**
```json
{
  "leadId": "LEAD-20260220-1002",
  "followUpQuestion": "Can you clarify your current portfolio allocation?"
}
```

**WF4 must:**
1. Find lead in Airtable by `leadId`
2. Update: `status` → `"AWAITING_INFO"`
3. Update Redis
4. Send email to lead with the `followUpQuestion`
5. Return `{"success": true, "leadId": "...", "status": "AWAITING_INFO"}`

---

## Part 5: Updating ALL n8n Workflows for Airtable

Every workflow that previously read/wrote Google Sheets must be updated to use the **n8n Airtable node** instead.

### n8n Airtable Node Configuration

**Credential:** Create an Airtable credential in n8n using the same PAT.

**Key operations:**
- **Create record:** `POST` to table with field values
- **Update record:** Find record ID first (via List + filterByFormula), then `PATCH`
- **List records:** `GET` with `filterByFormula` and optional `sort`

### Workflow-by-Workflow Changes

| Workflow | What Changes |
|----------|-------------|
| **WF1** | Replace Google Sheets "Append Row" with Airtable "Create Record" on Leads table |
| **WF2** | Replace Sheets "Update Row" with Airtable "Update Record" (find by leadId first) |
| **WF3** | Replace Sheets "Update Row" with Airtable "Update Record" |
| **WF4** | Remove GET endpoints entirely. Replace Sheets operations in POST endpoints with Airtable |
| **WF5** | Replace Sheets writes for booking data with Airtable. Also write to Appointments table |
| **WF6** | Replace Sheets read (email lookup) with Airtable `filterByFormula={email}='...'` |
| **WF7** | Replace Sheets read for OUTREACH_IN_PROGRESS leads with Airtable filter. Update followUpCount via Airtable |
| **WF8** | Reads lead from Redis (no Sheets change needed), but if it writes status, use Airtable |
| **WF9** | Replace Google Sheets reads with Airtable List Records for each config table. Still writes to Redis cache |

### Common Airtable Patterns in n8n

**Find a lead by leadId:**
```
Action: List Records
Table: Leads
filterByFormula: {leadId} = '{{ $json.leadId }}'
maxRecords: 1
```

**Update a lead record:**
```
Action: Update Record
Table: Leads
Record ID: {{ $json.records[0].id }}  (from the List step above)
Fields: { status: 'APPROVED', approvedAt: '...' }
```

**Create a new lead:**
```
Action: Create Record
Table: Leads
Fields: { leadId: '...', fullName: '...', ...all fields }
```

---

## Part 6: Lead Status State Machine (unchanged)

```
  FORM SUBMIT
      │
      ▼
   [WF1] ──→ DISQUALIFIED ──[admin override]──→ PENDING_ENRICHMENT
      │                                               │
      ▼                                               │
  PENDING_ENRICHMENT ◄────────────────────────────────┘
      │
      │ WF2 + WF3
      ▼
  PENDING_REVIEW
      │
      ├── [approve] → APPROVED → WF5
      │                  │
      │          ┌───────┴────────┐
      │         BOOKED      OUTREACH_IN_PROGRESS
      │          │                │
      │          ▼          ┌─────┼──────┐
      │       COMPLETED     │     │      │
      │                   BOOKED  │   UNRESPONSIVE
      │                     CANCELLED_BY_LEAD
      │
      ├── [reject] → REJECTED (WF8 sends email)
      │
      └── [request info] → AWAITING_INFO → [reply] → PENDING_REVIEW
```

Every status transition must update **BOTH Airtable AND Redis**.

---

## Part 7: Redis (still needed for workflow state)

Redis is still used by n8n workflows for fast state access during processing:

### Per-Lead State (TTL: 30 days)
```
Key:    leadstate_{leadId}
Type:   Hash
Fields: Mirror of all Airtable Leads fields
```

### Business Data Cache (TTL: 24 hours, refreshed by WF9)
```
firm:advisors           → JSON array of advisor objects
firm:service_tiers      → JSON array of service tier objects
firm:advisor_availability → JSON array of availability rows
firm:config             → JSON object of Configuration key/value pairs
firm:email_templates    → JSON object keyed by templateKey
```

WF9 reads these from Airtable (instead of Google Sheets) and caches them in Redis.

---

## Part 8: Environment Variables & Credentials

### n8n Credentials Required (6 total — Google Sheets removed)

| Credential | Used By | Purpose |
|-----------|---------|---------|
| **Airtable PAT** | WF1-WF9 | Read/write all Airtable tables |
| **Redis** | WF1-WF9 | Lead state + business cache |
| **Gmail / SMTP** | WF1, WF5, WF6, WF7, WF8 | Send emails to leads |
| **Gemini API Key** | WF2, WF6, WF8 | AI enrichment, email parsing |
| **Google Calendar OAuth2** | WF5, WF6 | Create/manage appointment events |
| **Google Calendar ID** | WF5 | Calendar resource ID |

### Placeholder Replacement in Workflow JSONs

Replace in all workflow JSONs:
```
YOUR_GOOGLE_SHEET_ID      → REMOVE (replaced by Airtable base ID)
YOUR_GOOGLE_SHEETS_CRED_ID → REMOVE (replaced by Airtable credential)
YOUR_AIRTABLE_BASE_ID     → Your Airtable base ID (appXXX)
YOUR_AIRTABLE_CRED_ID     → n8n Airtable credential ID
YOUR_REDIS_CRED_ID        → n8n Redis credential ID
YOUR_GMAIL_CRED_ID        → n8n Gmail/SMTP credential ID
YOUR_GEMINI_CRED_ID       → n8n Gemini API credential ID
YOUR_GCAL_CRED_ID         → n8n Google Calendar OAuth credential ID
YOUR_GOOGLE_CALENDAR_ID   → The Google Calendar resource ID
```

---

## Part 9: Startup Sequence

1. **Create Airtable base** from `NorthStar_Wealth_Advisory_Pipeline.xlsx`
2. **Create Airtable PAT** with read+write scope
3. **Configure field types** (Single Select for enums, Long Text for JSON fields)
4. **Set up n8n Airtable credential** using the PAT
5. **Import all 9 workflow JSONs** into n8n
6. **Replace all credential placeholders** in workflows
7. **Update all Sheets nodes to Airtable nodes** in each workflow
8. **Activate WF9** and run manually — verify Redis has `firm:config`, `firm:advisors`, etc.
9. **Set dashboard `.env`** with Airtable PAT + base ID + n8n URL
10. **Set intake form `.env`** with n8n webhook URL
11. **Start both React apps** (`npm run dev`)
12. **Activate WF1** and test form submission
13. **Verify lead appears in Airtable** and on the dashboard
14. **Activate remaining workflows** (WF4 for actions, WF7 for follow-ups, etc.)

---

## Part 10: Verification Checklist

- [ ] **Airtable base created** with all 9 tables imported from xlsx
- [ ] **Field types set** — Single Select for enums, Long Text for JSON strings
- [ ] **WF9 executed** — Redis has `firm:config`, `firm:advisors`, etc.
- [ ] **Dashboard loads** — shows leads from Airtable (not "(demo data)")
- [ ] **Metrics load** — calculated from Airtable Leads table
- [ ] **Advisors load** — ApproveModal shows advisors from Airtable, not hardcoded
- [ ] **Intake form submits** — POST to n8n WF1 returns 200
- [ ] **Lead appears in Airtable** — new record in Leads table with status
- [ ] **Disqualification works** — province "NT" → status = DISQUALIFIED in Airtable
- [ ] **AI enrichment writes to Airtable** — profileSummary, priorityScore populated
- [ ] **Dashboard refreshes** — new/updated leads appear after refresh button click
- [ ] **Approve action works** — dashboard calls n8n, Airtable status changes to APPROVED
- [ ] **Reject action works** — status → REJECTED, WF8 sends email
- [ ] **Override action works** — DISQUALIFIED → PENDING_ENRICHMENT, WF2 re-enriches
- [ ] **JSON fields preserved** — `recommendedServiceTier` etc. round-trip correctly as JSON strings
- [ ] **Enum values match** — same string values across intake form, Airtable, and dashboard formatters

---

## Part 11: Dashboard Data Expectations (Reference)

### Priority badge colors
- `priorityScore === "HIGH"` → red badge
- `priorityScore === "MEDIUM"` → amber badge
- `priorityScore === "LOW"` → green badge

### Availability status display
- `"PREFERRED_AVAILABLE"` → green checkmark
- `"BACKUP_AVAILABLE"` → yellow indicator
- `"SCHEDULING_REQUIRED"` → red warning

### JSON fields the dashboard parses
```
recommendedServiceTier → { tierId, tierName, reasoning }
advisorMatchRanking    → [{ advisorId, advisorName, matchScore, reasoning }]
riskFlags              → [{ flag, detail, severity }]
conversationStarters   → ["string1", "string2", "string3"]
suggestedBooking       → { advisorId, date, time, advisorName }
```

### Enum value reference (must match exactly)
```
investableAssets: under_25k | 25k_100k | 100k_250k | 250k_500k | 500k_1m | 1m_plus
annualIncome:     under_50k | 50k_100k | 100k_200k | 200k_500k | 500k_plus
investmentTimeline: under_1yr | 1_3yr | 3_5yr | 5_10yr | 10_plus
riskTolerance:    conservative | moderate | aggressive
province:         ON | BC | AB | QC | MB | SK | NS | NB | NL | PE | NT | YT | NU
status:           PENDING_ENRICHMENT | PENDING_REVIEW | APPROVED | REJECTED | DISQUALIFIED |
                  OUTREACH_IN_PROGRESS | BOOKED | COMPLETED | UNRESPONSIVE |
                  CANCELLED_BY_LEAD | AWAITING_INFO
priorityScore:    HIGH | MEDIUM | LOW
availabilityStatus: PREFERRED_AVAILABLE | BACKUP_AVAILABLE | SCHEDULING_REQUIRED
disqualificationReason: jurisdiction_not_served | below_asset_threshold | goal_mismatch
```

---

## Appendix: Modified File Reference

### Files created/modified in this update

| File | Change |
|------|--------|
| `admin-dashboard/src/utils/airtable.js` | **NEW** — Airtable REST API client with normalization |
| `admin-dashboard/src/utils/api.js` | **REWRITTEN** — reads from Airtable, writes to n8n |
| `admin-dashboard/src/hooks/useAdvisors.js` | **NEW** — fetches advisors from Airtable |
| `admin-dashboard/src/hooks/useLeads.js` | **UPDATED** — better error logging |
| `admin-dashboard/src/hooks/useMetrics.js` | **UPDATED** — better error logging |
| `admin-dashboard/src/components/ApproveModal.jsx` | **UPDATED** — uses `useAdvisors()` hook instead of hardcoded data |
| `admin-dashboard/.env.example` | **REWRITTEN** — Airtable + n8n vars |
| `client-intake-form/.env.example` | **UPDATED** — clarified comments |
| `WIRING_GUIDE.md` | **REWRITTEN** — this document |

### Original project files (unchanged)

| File | Purpose |
|------|---------|
| `NorthStar_Wealth_Advisory_Pipeline.xlsx` | Airtable import template |
| `WF1_Intake_Auto_Disqualification.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF2_AI_Enrichment.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF3_Availability_PreCheck.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF4_Dashboard_API.json` | n8n workflow (remove GET endpoints, swap Sheets→Airtable) |
| `WF5_Email_Outreach_Booking.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF6_Inbound_Email_Processing.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF7_FollowUp_Cadence.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF8_Rejection_Email.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `WF9_Business_Data_Cache_Refresh.json` | n8n workflow (needs Sheets→Airtable node swap) |
| `client-intake-form/` | React intake form (no code changes needed) |
| `system-spec.md` | Full system specification |
| `SETUP_GUIDE.md` | Setup instructions |
