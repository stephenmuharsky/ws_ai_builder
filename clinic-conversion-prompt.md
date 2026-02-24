# MASTER PROMPT: Convert Nail Salon Booking System → AI Dental Clinic Patient Operations Agent

## YOUR TASK

You are converting an existing, production-grade WhatsApp booking automation system built for a nail salon in Cancún, Mexico into an **AI Patient Operations Agent for a small dental clinic**. The new system must preserve the core architecture while adding a critical new capability: **human-in-the-loop triage and escalation**.

This system is being built as a prototype submission for a job application. It must demonstrate:
1. An AI system that meaningfully expands what a human can do
2. A clearly defined human role
3. Real cognitive/operational responsibility taken on by the AI
4. One critical decision that must remain human — and why

**Output all artifacts as complete, importable files** — n8n workflow JSONs, Google Apps Script code, and Google Sheets structure definitions.

---

## SOURCE SYSTEM ARCHITECTURE (What you're converting FROM)

### Overview
The source system is a WhatsApp-based AI booking agent for "Amar Nail Spa" that handles the full appointment lifecycle: booking creation, modification, cancellation, viewing, confirmation reminders, and general questions. It runs on n8n (workflow automation), Redis (state management), Google Sheets (data store), Google Calendar (scheduling), and Twilio (WhatsApp messaging).

### Tech Stack
- **n8n** (self-hosted on AWS EC2) — workflow orchestration
- **Redis** — session state, message batching, rate limiting, business data cache
- **Google Sheets** — bookings, contacts, services, employee info, availability, earnings, configuration
- **Google Calendar** — visual schedule + event sync
- **Google Apps Script** — spreadsheet automations (auto-sort, auto-fill, availability sync, calendar sync, deletion cleanup)
- **Twilio WhatsApp API** — message send/receive
- **AI Models** — Gemini 2.5 Flash (primary, cost-efficient), structured output parsers
- **Timezone** — America/Cancun (EST, UTC-5)

### n8n Workflows (7 total)

#### 1. CANCUN NAILS MAIN (357 nodes) — The core conversational engine
**Section 1 — Message Intake & Normalization:**
- WhatsApp webhook receives messages
- Filters non-text (audio/media → notification)
- Sets initial data (phone, name, execution ID)
- Rate limiter: 30 msgs/hour per user (alerts owner if exceeded)
- Message batching: Redis list buffers messages for 8 seconds (handles split messages)
- Processing lock: ensures only one execution processes per user at a time
- Messages combined into single payload

**Section 2 — State Router & Confirmation Check:**
- Checks Redis for existing conversation state before routing
- Routes to: confirmation handler, birthday pending, mixed service response, unqualified tech response, or intent router
- Also checks for booking confirmation system state (separate workflow)

**Section 3 — Birthday Response Flow:**
- Handles responses when user has pending birthday request during registration
- AI agent classifies: birthday_provided, declined, unclear, modification_request
- Routes to registration completion or re-ask

**Section 4 — Mixed Service Response Flow:**
- When requested services require different technician qualifications
- User chooses: keep restricted (specialty) services only, or switch to standard services only
- AI classifier: KEEP_RESTRICTED, KEEP_NORMAL, UNCLEAR

**Section 5 — Unqualified Tech Response Flow:**
- When selected technician can't perform requested service
- Options: accept qualified tech, pick specific employee, decline, clarify
- AI classifier with structured output

**Section 6 — Intent Router:**
- First-time/returning user greeting
- AI intent classifier (STATELESS — no memory, classifies single message):
  - CREATE_BOOKING, CANCEL_BOOKING, UPDATE_BOOKING, VIEW_BOOKINGS, GENERAL_QUESTION, CONFIRM_BOOKING, UNCLEAR
- Checks if user needs registration, fetches existing bookings

**Section 7 — Confirmation Handling:**
- Routes "confirm"/"save" messages to correct pending flow
- Checks which confirmation context is active (pending update, pending booking, etc.)

**Section 8 — CREATE BOOKING (Extraction & Validation):**
- Extractor Agent: extracts service, datetime, technician from conversation
  - Uses tools: list_services (Google Sheets), employee_list (Google Sheets)
  - Outputs structured JSON: `{service: {}, datetime: {}, technician: {}}`
  - Has retry logic (up to 2 retries on extraction failure)
- Service Restriction Check: validates technician qualifications against allowed employees
- Routes to: availability check, mixed services prompt, unqualified tech prompt

**Section 9 — Availability Check:**
- Availability Agent: checks if requested slot is available
  - Uses tools: get_employee_availability (Google Sheets), process_availability_check (code tool)
  - Handles: specific employee check, any-available check, NEXT_AVAILABLE logic
  - Excludes original booking time in UPDATE flows
- If available → save booking (Google Sheets + Google Calendar + Redis state update)
- If unavailable → find alternatives, present to user

**Section 10 — Response Agent:**
- Generates natural language responses for missing fields, validation errors
- Business rules enforcement (hours, no Sundays, etc.)

**Section 11 — Alternative Selection:**
- When requested time unavailable, user is presented alternatives
- AI classifier: selected, other_technician, reroute, unclear

**Section 12 — CANCEL BOOKING:**
- Cancel Agent identifies which booking to cancel
- Calculates blocked time to remove from Employee Availability
- Removes from: Google Sheets row, Employee Availability blocked times, Google Calendar event
- Sends cancellation confirmation

**Section 13 — UPDATE BOOKING:**
- Update Selector Agent: identifies which appointment to modify
- Context Switch Identifier: continuing same modification or switching to different appointment
- Update Extractor Agent: extracts CHANGES only (compares against original)
- Merge logic: combines changes with original appointment data
- Availability check with original booking exclusion
- Executes update: Google Sheets row, Employee Availability (old blocked time removed, new added), Google Calendar event

**Section 14 — VIEW BOOKINGS:**
- Fetches and displays user's upcoming appointments

**Section 15 — GENERAL QUESTION:**
- General Question Agent answers using tools:
  - list_biz_info (Google Sheets Configuration tab)
  - list_services (Google Sheets Services tab)
  - employee_list (Google Sheets Employee Info tab)
  - gq_employee_availability (checks specific tech's schedule)
- If question can't be answered → currently just gives best effort response
- **THIS IS WHERE THE NEW ESCALATION FLOW WILL BE ADDED**

**Key State Management Pattern:**
- Redis hash `userflag_{phone}` stores all session state
- Fields: serviceName, dateTime, employeeID, employeeName, pendingAlternatives, pendingBirthday, awaitingMixedResponse, awaitingUnqualifiedResponse, bookingModification, etc.
- "ONE FLAG PER TURN" principle — AI agents set only one Redis flag per execution to prevent iteration limit issues
- Deterministic code-based routing (Switch/If nodes) — NOT AI-driven workflow orchestration

**Error Handling Pattern:**
- Every AI agent has a dedicated error output node (Twilio message to user + optional email to admin)
- Named consistently: "Intent Error", "Extractor Error", "Availability Error", etc.

#### 2. Booking Confirmation System (50 nodes)
- Daily 8AM trigger finds tomorrow's unconfirmed bookings
- Groups by phone number, sends FIRST reminder only
- Redis queue tracks remaining bookings per phone
- YES → confirm current booking (update Google Sheets "Booking Confirmed" column), check queue → send next or finish
- NO → set PENDING_CANCEL state, ask "reply CANCEL"
- CANCEL → delete booking row + availability + calendar event, check queue → send next
- Redis hash: `confirm_state_{phone}` with fields: state, currentBookingId, rowNumber, bookingInfo, queue, allDetails

#### 3. Business Data Cache Refresh (13 nodes)
- Triggers: daily midnight, Google Sheets webhook on edit, manual
- Fetches: all services, all employees, business info (Configuration tab)
- Builds single cache JSON object
- Saves to Redis key for fast access during conversations
- Error handling with Gmail failure alert

#### 4. Daily Bookings Archive (24 nodes)
- Daily 11:59 PM trigger
- Moves past bookings from "Bookings (Future)" to "Bookings (Past)" sheet
- Error handling with dual notification (email + WhatsApp to owner)

#### 5. Generate Available Slots Sheet (13 nodes)
- Populates Employee Availability sheet with upcoming dates
- Cross-references Weekly Schedule for working hours per employee per day

#### 6. Populate Weekly Schedule From Default (11 nodes)
- Takes Default Schedule (admin) template
- Generates 12 weeks of Weekly Schedule entries
- Each employee gets their default hours applied to each week

#### 7. Weekly Earnings Report (25 nodes)
- Scheduled weekly trigger
- Calculates per-technician: total services, gross revenue, tips, commission, net profit
- Writes to Earnings (admin) sheet
- Sends summary via WhatsApp/email

### Google Sheets Structure (9 tabs)

**Bookings (Future)** — Active upcoming appointments
| Column | Field |
|--------|-------|
| A | Booking Type (service name) |
| B | Booking Time (datetime) |
| C | Nail Technician (name) |
| D | Employee ID (EMP001, etc.) |
| E | Client Name |
| F | Contact ID (phone number) |
| G | Booking Confirmed (Yes/No) |
| H | Amount (auto-calculated from services) |
| I | Payment Method |
| J | Tips |
| K | Extra |
| L | Booking End Time (auto-calculated) |
| M | Booking Date |
| N | Booking ID (auto-generated: BK-timestamp-random) |
| O | Calendar Event ID |

**Bookings (Past)** — Same as Future minus Calendar Event ID column

**Weekly Schedule** — Per-employee weekly hours
| Column | Field |
|--------|-------|
| A | Employee Name |
| B | Role |
| C | Week (e.g., "Jan 26 - Feb 1, 2026") |
| D-J | Monday-Sunday (hours or "OFF") |
| K | Total Hours |
| L | Employee ID |

**Default Schedule (admin)** — Template for generating Weekly Schedule
| Column | Field |
|--------|-------|
| A | Employee Name |
| B | Role |
| C-I | Monday-Sunday (default hours) |
| J | Employee ID |
| K | Remaining Vacation Days |
| L | Total Hours |

**Contacts** — Registered patients/clients
| Column | Field |
|--------|-------|
| A | Contact ID (phone number) |
| B | Name |
| C | Birthday |
| D | Registration Date |
| E | Total Visits |
| F | Last Visit |

**Earnings (admin)** — Weekly financial summaries
| Column | Field |
|--------|-------|
| A | Week Ending |
| B | Technician |
| C | Salary Paid Out |
| D | Total Services |
| E | Gross Revenue |
| F | Total Tips |
| G | Tips net Credit Card Fee |
| H | Commission Earned |
| I | Net Expense |
| J | Net Profit |
| K | Calculation Date |

**Configuration** — Business info (key-value pairs in columns A-B)
- Salon Name, Address, Hours, Phone, etc.

**Services (admin)** — Service catalog
| Column | Field |
|--------|-------|
| A | Service Name |
| B | Service Price |
| C | Duration (min) |
| D | Service ID |
| E | Service Description |
| F | Allowed Employees (comma-separated EMP IDs) |

**Employee Info (admin doc)** — Staff details
| Column | Field |
|--------|-------|
| A | Employee Name |
| B | Phone |
| C | Email |
| D | Commission Rate |
| E | Weekly Base Salary |
| F | Employee ID |
| G | Calendar Color |
| H | Exclude From Payroll |

**Employee Availability** — Daily availability per employee
| Column | Field |
|--------|-------|
| A | Date |
| B | Employee ID |
| C | Match Key (YYYY-MM-DD_EMPXXX) |
| D | Employee Name |
| E | Working Hours |
| F | Blocked Times (comma-separated slots) |

### Google Apps Script (1,259 lines)
Handles spreadsheet automations:
- **Auto-sort**: Bookings (Future) sorted by Booking Time when technician is set
- **Auto-fill**: Booking ID generation (BK-timestamp-random), Amount calculation from services, End Time calculation from service duration, Employee ID lookup from technician name, Contact ID lookup from client name, Booking Confirmed default "No"
- **Employee Availability sync**: When booking added/modified, blocked time slots are added/removed from Employee Availability sheet
- **Google Calendar sync**: Creates/updates/deletes calendar events. Debounced 60-second delay to batch rapid edits. Color-coded by technician.
- **Snapshot system**: Detects right-click row deletion via onChange trigger, compares current Booking IDs against stored snapshot, cleans up availability + calendar for deleted bookings
- **Weekly Schedule sort**: Sorts by parsed week date
- **Menu**: Custom menu for manual operations (sort, delete with cleanup, update calendar, sync/reconcile)

---

## TARGET SYSTEM SPECIFICATION (What you're converting TO)

### Business Context: Small Dental Clinic
- 2-3 dentists, 1 dental hygienist, 1 receptionist
- Operates in Cancún, Mexico (same timezone: America/Cancun)
- Patients communicate via WhatsApp (standard in Latin American healthcare)
- Bilingual: Spanish primary, English supported
- Currently running on: WhatsApp + receptionist memory + paper/spreadsheet

### Domain Mapping (Nail Salon → Dental Clinic)

| Nail Salon Concept | Dental Clinic Equivalent |
|---|---|
| Nail Technician | Dentist / Dental Hygienist |
| Service (Manicure, Pedicure, etc.) | Procedure (Cleaning, Filling, Crown, etc.) |
| Employee ID (EMP001) | Provider ID (DEN001, HYG001) |
| Booking | Appointment |
| Client | Patient |
| Contact | Patient Record |
| Tips | N/A (remove) |
| Payment Method | Insurance Provider (or Cash/Card) |
| Booking Confirmed | Appointment Confirmed |
| Commission Rate | N/A (remove — dentists are salaried or partners) |
| Calendar Color | Calendar Color (keep — per provider) |
| Allowed Employees | Qualified Providers (dentists do fillings/crowns, hygienists do cleanings) |

### New Sheet Tabs (Renamed/Modified)

**Appointments (Future)** — replaces Bookings (Future)
| Column | Field | Notes |
|--------|-------|-------|
| A | Procedure Type | Renamed from Booking Type |
| B | Appointment Time | Renamed from Booking Time |
| C | Provider | Renamed from Nail Technician |
| D | Provider ID | Renamed from Employee ID (DEN001, HYG001) |
| E | Patient Name | Renamed from Client Name |
| F | Patient ID | Renamed from Contact ID (phone number) |
| G | Appointment Confirmed | Renamed from Booking Confirmed |
| H | Cost | Renamed from Amount |
| I | Insurance Provider | Renamed from Payment Method |
| J | Notes | Renamed from Tips — now free-text clinical notes |
| K | Referral Source | Renamed from Extra |
| L | Appointment End Time | Renamed from Booking End Time |
| M | Appointment Date | Renamed from Booking Date |
| N | Appointment ID | Renamed from Booking ID (APT-timestamp-random) |
| O | Calendar Event ID | Same |

**Appointments (Past)** — same as above minus Calendar Event ID

**Patient Records** — replaces Contacts
| Column | Field | Notes |
|--------|-------|-------|
| A | Patient ID | Phone number |
| B | Name | Same |
| C | Date of Birth | Renamed from Birthday — full DOB for medical context |
| D | Registration Date | Same |
| E | Total Visits | Same |
| F | Last Visit | Same |
| G | Insurance Provider | NEW |
| H | Allergies | NEW — critical for dental (latex, anesthesia, antibiotics) |
| I | Medical Notes | NEW — relevant medical conditions |

**Services (admin)** → **Procedures (admin)**
| Column | Field | Notes |
|--------|-------|-------|
| A | Procedure Name | e.g., "Limpieza dental", "Empaste", "Corona", "Extracción", "Blanqueamiento" |
| B | Procedure Price | In MXN |
| C | Duration (min) | Same |
| D | Procedure ID | Same pattern |
| E | Procedure Description | Same |
| F | Qualified Providers | Renamed from Allowed Employees — who can perform this |
| G | Requires Clinical Approval | NEW — boolean, if true, AI must escalate to human before booking |

**Employee Info (admin doc)** → **Provider Info (admin)**
| Column | Field | Notes |
|--------|-------|-------|
| A | Provider Name | Same |
| B | Phone | Same |
| C | Email | Same |
| D | Specialization | NEW — replaces Commission Rate (e.g., "General Dentistry", "Endodontics", "Hygiene") |
| E | Weekly Base Salary | Same |
| F | Provider ID | DEN001, HYG001, etc. |
| G | Calendar Color | Same |
| H | Is Admin/Escalation Contact | NEW — replaces Exclude From Payroll — boolean, receives escalated messages |

**Configuration** — Updated business info
- Clinic Name, Address, Hours, Phone, Emergency Protocol, Insurance Accepted (comma-list), Escalation Email, etc.

**Escalation Log** — **BRAND NEW TAB**
| Column | Field | Notes |
|--------|-------|-------|
| A | Timestamp | When escalation was created |
| B | Patient ID | Phone number |
| C | Patient Name | From patient records |
| D | Classification | CLINICAL, BILLING, ADMINISTRATIVE, URGENT, UNKNOWN |
| E | Question/Concern | The actual message content |
| F | Conversation Context | Summary of conversation leading to escalation |
| G | AI Confidence | How confident the AI was (LOW/MEDIUM — if HIGH it would have answered) |
| H | Status | PENDING, IN_PROGRESS, RESOLVED, ADDED_TO_KB |
| I | Resolution | What the human answered |
| J | Resolved By | Provider name who resolved |
| K | Resolved At | Timestamp of resolution |
| L | Added to Knowledge Base | Yes/No — was the answer fed back |

**Knowledge Base** — **BRAND NEW TAB**
| Column | Field | Notes |
|--------|-------|-------|
| A | Question Pattern | Common phrasing of the question |
| B | Answer | The approved answer |
| C | Category | CLINICAL_GENERAL, INSURANCE, PROCEDURES, POST_CARE, PRICING, POLICY |
| D | Added Date | When it was added |
| E | Source | "Manual" or "Escalation #{row}" |
| F | Approved By | Which provider approved this answer |
| G | Active | Yes/No — can be deactivated without deleting |

### New Workflows to Build

All existing workflows should be converted with the domain mapping above. Additionally:

#### NEW: Escalation & Triage Flow
This is the **centerpiece new capability** that doesn't exist in the source system. It must be integrated into the MAIN workflow's General Question handling (Section 15) and also as a cross-cutting concern available from any conversation state.

**Triage Classification Logic** (deterministic code node, NOT AI-driven):
```
INPUT: AI agent's response + confidence indicators + message content
CLASSIFY:
  - Contains symptom keywords (dolor, hinchazón, sangrado, fiebre, pain, swelling, bleeding, fever, broken, knocked out, emergency) → URGENT
  - Contains clinical terminology or post-procedure concerns → CLINICAL  
  - Contains insurance, billing, cost, coverage questions the KB can't answer → BILLING
  - Contains scheduling edge cases AI can't resolve → ADMINISTRATIVE
  - AI explicitly indicates low confidence or "I don't know" → UNKNOWN
```

**Escalation Flow:**
1. AI General Question Agent attempts to answer using Knowledge Base tool + existing business info tools
2. If the agent returns a `confidence: "low"` or `canAnswer: false` flag, OR if triage classifier detects clinical/urgent content:
   a. Send patient a warm message: "Excelente pregunta — voy a pedir que nuestro equipo clínico le dé seguimiento directamente. / Great question — I'm going to have our clinical team follow up with you directly."
   b. Classify the escalation (URGENT, CLINICAL, BILLING, ADMINISTRATIVE, UNKNOWN)
   c. Log to Escalation Log sheet (all fields)
   d. If URGENT: Send immediate WhatsApp alert to ALL providers marked `Is Admin/Escalation Contact = true` AND send email with HIGH PRIORITY flag
   e. If CLINICAL/BILLING/ADMINISTRATIVE: Send structured email to Escalation Email from Configuration
   f. Set Redis flag `escalation_pending_{phone}` so subsequent messages from this patient don't re-trigger the same escalation
   g. Include in email/WhatsApp: Patient name, phone, classification, the question, conversation summary (last 5 messages from Redis chat memory)

**Knowledge Base Tool** (new AI agent tool):
- Google Sheets Tool reading from Knowledge Base tab
- Filters by Active = "Yes"
- AI agent searches by Question Pattern and Category
- Returns the Answer if found with high confidence
- Returns `canAnswer: false` if no good match

**Feedback Loop** (manual, not automated):
- Human resolves escalation → updates Escalation Log (Status, Resolution, Resolved By)
- If answer should be reusable → human adds row to Knowledge Base tab, marks Escalation Log "Added to Knowledge Base = Yes"
- Next time Business Data Cache Refresh runs, KB is cached in Redis for faster access

### Modifications to Existing MAIN Workflow

**Section 6 — Intent Router:**
- Add intent: EMERGENCY — for obvious urgent messages that should bypass normal flow entirely
- EMERGENCY → immediate triage as URGENT (skip General Question Agent)

**Section 15 — General Question (MAJOR REWORK):**
- Add Knowledge Base tool to General Question Agent's tool set
- Add structured output requirement: agent must return `{answer: string, confidence: "high"|"medium"|"low", canAnswer: boolean, category: string}`
- After agent response:
  - If `canAnswer: true` AND `confidence: "high"` → send answer to patient (existing flow)
  - If `canAnswer: true` AND `confidence: "medium"` → send answer BUT ALSO log to Escalation Log as informational (Status: AUTO_ANSWERED, for human review)
  - If `canAnswer: false` OR `confidence: "low"` → trigger Escalation Flow
- Add Triage Classifier code node BEFORE sending any response — catches clinical/urgent content even if AI thinks it can answer

**All AI Agent System Prompts:**
- Change all salon references to dental clinic context
- Change "RESPOND IN ENGLISH ONLY" to "RESPOND IN SPANISH BY DEFAULT. If the patient writes in English, respond in English."
- Update service examples from nail services to dental procedures
- Update technician references to provider/dentist/hygienist
- Add to ALL agent prompts: "If the patient describes any symptoms, pain, bleeding, swelling, or medical concerns, you MUST set canAnswer to false and defer to clinical staff. You are NOT qualified to provide medical advice or assess symptoms."

**Registration Flow (Section 3 — Birthday):**
- Expand to collect: Date of Birth (not just birthday), Insurance Provider, Allergies
- These are critical for dental context
- Ask in sequence, allow "skip" for each except DOB

### Modifications to Booking Confirmation System
- Rename all references from booking → appointment
- Change confirmation messages from nail salon language to dental clinic language
- Add: if patient replies with anything resembling a clinical question during confirmation flow, trigger escalation instead of treating as unclear

### Modifications to Apps Script
- Rename all function references and sheet names (Bookings → Appointments, etc.)
- Change Booking ID prefix from "BK-" to "APT-"
- Remove Tips-related auto-calculations
- Add: when a row is added to Escalation Log manually (human updating Status), auto-populate Resolved At timestamp
- Keep all calendar sync, availability management, snapshot deletion detection — these are domain-agnostic

### Modifications to Supporting Workflows
- **Business Data Cache Refresh**: Add Knowledge Base to cached data
- **Daily Bookings Archive**: Rename bookings → appointments, same logic
- **Generate Available Slots Sheet**: Same logic, different sheet names
- **Populate Weekly Schedule**: Same logic
- **Weekly Earnings Report**: Convert to "Weekly Clinic Revenue Report" — remove tips/commission, add insurance-billed vs cash totals

---

## CRITICAL ARCHITECTURAL PRINCIPLES (Preserve These)

1. **Deterministic routing over AI orchestration** — Use Switch/If nodes for state transitions. AI handles NLP only.
2. **ONE FLAG PER TURN** — AI agents set only one Redis flag per execution to prevent iteration limits.
3. **Message batching** — 8-second Redis buffer for split messages.
4. **Processing lock** — One execution per user at a time.
5. **Rate limiting** — 30 msgs/hour per user.
6. **Error handling** — Every AI agent has a dedicated error output with user notification + admin alert.
7. **Redis session state** — All conversation state in `userflag_{phone}` hash.
8. **Business data cache** — Redis cache refreshed on schedule + on Google Sheets edit webhook.
9. **Dual notifications** — Critical errors sent via both email and WhatsApp.

---

## OUTPUT REQUIREMENTS

Generate the following complete, importable artifacts:

### 1. MAIN WORKFLOW JSON (n8n import-ready)
- Full conversion of CANCUN NAILS MAIN with all domain changes
- New Escalation & Triage flow integrated into Section 15
- New EMERGENCY intent in Section 6
- New Knowledge Base tool on General Question Agent
- Updated all AI agent system prompts for dental clinic context
- All sticky notes updated with new documentation
- Proper node connections including new escalation paths

### 2. BOOKING CONFIRMATION SYSTEM JSON (n8n import-ready)
- Converted to appointment confirmation language
- Clinical question detection during confirmation flow

### 3. BUSINESS DATA CACHE REFRESH JSON (n8n import-ready)
- Added Knowledge Base sheet to cache

### 4. SUPPORTING WORKFLOWS JSON (n8n import-ready)
- Daily Bookings Archive → Daily Appointments Archive
- Generate Available Slots Sheet (renamed references)
- Populate Weekly Schedule (same)
- Weekly Earnings Report → Weekly Clinic Revenue Report

### 5. GOOGLE APPS SCRIPT (Code.gs)
- Full conversion with renamed sheets/columns/IDs
- Escalation Log auto-timestamp on status update
- Appointment ID prefix "APT-"

### 6. GOOGLE SHEETS STRUCTURE DEFINITION
- Complete column definitions for all tabs (existing converted + new)
- Sample data rows for Procedures, Provider Info, Configuration, Knowledge Base
- Include realistic dental clinic sample data:
  - Procedures: Limpieza dental (cleaning), Empaste (filling), Corona (crown), Extracción (extraction), Blanqueamiento (whitening), Endodoncia (root canal), Radiografía (x-ray), Consulta general (general consultation)
  - Providers: Dr. García (DEN001, General Dentistry), Dr. Ramírez (DEN002, Endodontics), María López (HYG001, Dental Hygiene)
  - Knowledge Base entries: common patient questions about insurance, post-procedure care, clinic policies

---

## SAMPLE CONVERSATIONS (For Testing)

### Test 1: Routine Booking (AI handles fully)
```
Patient: Hola, quiero agendar una limpieza dental para el jueves
AI: ¡Hola! Con gusto te ayudo a agendar tu limpieza dental. Tenemos disponibilidad el jueves con María López (higienista dental). ¿Prefieres por la mañana o por la tarde?
Patient: En la tarde, como a las 3
AI: Perfecto. Tienes disponible las 3:00 PM con María López. La limpieza dental tiene una duración de 45 minutos y un costo de $800 MXN. ¿Confirmas la cita?
Patient: Sí, confirmo
AI: ✅ ¡Cita confirmada! Limpieza dental el jueves a las 3:00 PM con María López. Te enviaremos un recordatorio. ¡Te esperamos!
```

### Test 2: Knowledge Base Question (AI answers)
```
Patient: Do you accept MetLife insurance?
AI: Yes! We accept MetLife dental insurance. Please bring your insurance card to your appointment so we can process your claim. Is there anything else I can help you with?
```

### Test 3: Clinical Question → Escalation
```
Patient: Me hicieron un empaste la semana pasada y me sigue doliendo mucho al masticar, ¿es normal?
AI: Entiendo tu preocupación. Voy a pedir que nuestro equipo clínico te dé seguimiento directamente para asegurarnos de que todo esté bien. Alguien se comunicará contigo pronto.
[BEHIND THE SCENES: Escalation logged as CLINICAL, email sent to clinic with full context]
```

### Test 4: Urgent → Immediate Alert
```
Patient: Mi hijo se cayó y se le salió un diente, hay mucha sangre
AI: Entiendo que es una situación urgente. Estoy notificando a nuestro equipo clínico inmediatamente. Alguien se comunicará contigo en los próximos minutos. Mientras tanto, aplica presión suave con una gasa limpia en el área del sangrado.
[BEHIND THE SCENES: URGENT alert sent via WhatsApp + email to all admin providers immediately]
```

### Test 5: Unknown Question → Escalation with Learning
```
Patient: Can I use my HSA card to pay for teeth whitening?
AI: Great question — I'm going to have our team follow up with you directly on that so you get the right information.
[BEHIND THE SCENES: Escalation logged as BILLING, email sent. Later, human answers "Yes, HSA can be used for whitening if prescribed by dentist." Answer added to Knowledge Base.]
```

---

## IMPORTANT NOTES

- Preserve ALL node IDs from source workflows where possible (enables easier diffing)
- Use Twilio for WhatsApp (same as source — NOT Meta WhatsApp API directly)
- Keep Gemini 2.5 Flash as primary AI model
- All timestamps in America/Cancun timezone
- Google Sheets document ID should be a placeholder: `YOUR_GOOGLE_SHEET_ID`
- Google Calendar ID should be a placeholder: `YOUR_GOOGLE_CALENDAR_ID`
- Redis connection should reference existing credential by name
- All AI agent prompts must include the dental clinic safety guardrail about not providing medical advice
- The Escalation Flow is the most important new feature — it must be robust, well-documented with sticky notes, and demonstrate the human-in-the-loop principle clearly
