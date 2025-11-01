# Phase 1 Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GOOGLE WORKSPACE                          │
│                                                                   │
│  ┌─────────────────┐              ┌─────────────────────────┐  │
│  │  Gmail Account  │              │   Google Sheet (Bound)   │  │
│  │ hello@mythoria  │              │                          │  │
│  │                 │              │  ┌───────────────────┐  │  │
│  │  Labels:        │              │  │ Config (Blue)     │  │  │
│  │  • Ticketed     │              │  │ ├─ enabled       │  │  │
│  │  • Bounce       │◄─────────────┼──┤ ├─ batch_size   │  │  │
│  │  • No-Action    │   Labeling   │  │ └─ tz           │  │  │
│  │  • Needs-Review │              │  └───────────────────┘  │  │
│  └─────────────────┘              │  ┌───────────────────┐  │  │
│                                    │  │ Runs_Log (Green) │  │  │
│                                    │  │ Messages_Log     │  │  │
│  ┌─────────────────────────────┐  │  │ Bounces (Red)    │  │  │
│  │  Google Apps Script Project │  │  │ Tickets (Purple) │  │  │
│  │                              │  │  │ Errors (Orange)  │  │  │
│  │  Files:                      │  │  └───────────────────┘  │  │
│  │  • Code.js                   │  │                          │  │
│  │  • Initialize.js             │  │  Custom Menu:            │  │
│  │  • ConfigManager.js          │◄─┼──• Initialize Tabs     │  │
│  │  • Logger.js                 │  │  • Initialize Labels    │  │
│  │  • KnowledgeBase.js          │  │  • Test Phase 1         │  │
│  │  • Test.js                   │  │  • View Config          │  │
│  │  • appsscript.json           │  │  • View KB Summary      │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Script Properties (Secure Storage)                │ │
│  │  • openai_api_key        (encrypted)                        │ │
│  │  • mythoria_api_token    (encrypted)                        │ │
│  │  • mythoria_api_base     (API endpoint)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Phase 1

```
┌──────────────┐
│ User Action  │
│ (Via Menu)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Initialize.js        │
│ • initializeSheets() │──► Creates 6 Tabs with Headers
│ • initializeLabels() │──► Creates 4 Gmail Labels
└──────────────────────┘

┌──────────────┐
│ Test Phase 1 │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│                    Test.js                          │
│                                                     │
│  Test 1: Config Read                               │
│  └──► ConfigManager.js ──► Config Tab             │
│                                                     │
│  Test 2: KB Load                                   │
│  └──► KnowledgeBase.js ──► Embedded JSON          │
│                                                     │
│  Test 3: Logs Write                                │
│  └──► Logger.js ──► All 5 Log Tabs                │
│                                                     │
│  Test 4: Script Properties                         │
│  └──► Code.js ──► PropertiesService               │
│                                                     │
│  Test 5: Gmail Labels                              │
│  └──► GmailApp ──► Label Existence Check          │
└─────────────────────────────────────────────────────┘
```

---

## File Dependencies

```
Code.js (Main Entry)
├── Requires: ALL modules
├── Provides: Core utilities, menu, getSpreadsheet()
└── Calls: Initialize, Config, Logger, KB, Test

Initialize.js
├── Requires: Code.js (utilities), Logger.js
├── Provides: Sheet & Gmail setup
└── Calls: getOrCreateSheet(), logError()

ConfigManager.js
├── Requires: Code.js (utilities)
├── Provides: Configuration reading
└── Calls: getSpreadsheet(), getScriptProperty()

Logger.js
├── Requires: Code.js (utilities), ConfigManager.js
├── Provides: Logging functions
└── Calls: getOrCreateSheet(), formatTimestamp()

KnowledgeBase.js
├── Requires: Code.js (utilities), Logger.js
├── Provides: KB loading & rule matching
└── Calls: safeJsonParse(), logError()

Test.js
├── Requires: ALL modules
├── Provides: Test suite
└── Calls: loadConfig(), loadKnowledgeBase(), logRun(), etc.
```

---

## Sheet Structure

```
┌───────────────────────────────────────────────────────────┐
│                  GOOGLE SHEET                              │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Tab 1: Config (Blue Headers)                             │
│  ┌────────────┬────────────┬─────────────────────┐       │
│  │ Key        │ Value      │ Description         │       │
│  ├────────────┼────────────┼─────────────────────┤       │
│  │ enabled    │ true       │ Enable/disable      │       │
│  │ batch_size │ 20         │ Messages per run    │       │
│  │ tz         │ Europe/... │ Timezone            │       │
│  │ ...        │ ...        │ ...                 │       │
│  └────────────┴────────────┴─────────────────────┘       │
│                                                            │
│  Tab 2: Runs_Log (Green Headers)                          │
│  ┌───────────┬──────────┬──────────┬──────────┬────────┐│
│  │ Timestamp │ Duration │ Proc'd   │ Ticketed │ Errors ││
│  ├───────────┼──────────┼──────────┼──────────┼────────┤│
│  │ 2025-...  │ 2.5s     │ 10       │ 5        │ 0      ││
│  └───────────┴──────────┴──────────┴──────────┴────────┘│
│                                                            │
│  Tab 3: Messages_Log (Yellow Headers)                     │
│  ┌───────────┬──────────┬──────┬─────────┬──────────┐   │
│  │ Timestamp │ ThreadID │ From │ Subject │ Priority │   │
│  ├───────────┼──────────┼──────┼─────────┼──────────┤   │
│  │ 2025-...  │ thread_1 │ ...  │ Help!   │ P2       │   │
│  └───────────┴──────────┴──────┴─────────┴──────────┘   │
│                                                            │
│  Tab 4: Bounces (Red Headers)                             │
│  Tab 5: Tickets (Purple Headers)                          │
│  Tab 6: Errors (Orange Headers)                           │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## Knowledge Base Structure

```
Knowledge Base (Embedded in KnowledgeBase.js)
│
├── Denylist (Skip patterns)
│   ├── Rule: noreply domains → skip
│   └── Rule: automated addresses → skip
│
├── Rules (Processing)
│   ├── bounce_detection → handle DSN
│   ├── billing_priority → P2 ticket
│   ├── urgent_support → P0 ticket
│   ├── general_support → P3 ticket
│   ├── sales_inquiry → P2 ticket
│   ├── legal_compliance → P1 ticket
│   └── abuse_report → P1 ticket
│
└── Allowlist (Force ticket)
    └── trustedpartner.com → P2 ticket

Processing Order:
1. Check Denylist (first match → skip)
2. Check Rules (first match → action)
3. Check Allowlist (first match → ticket)
4. No match → LLM (future phase)
```

---

## Configuration Flow

```
┌──────────────────┐
│  Config Tab      │
│  (Google Sheet)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  ConfigManager.js        │
│                          │
│  loadConfig()            │◄───── Code reads config
│  ├─► Parse rows          │
│  ├─► Skip empty          │
│  └─► Return object       │
│                          │
│  getConfig(key)          │◄───── Get single value
│  getConfigBoolean(key)   │◄───── Get as boolean
│  getConfigNumber(key)    │◄───── Get as number
│  getConfigArray(key)     │◄───── Get as array
└──────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Application Code        │
│                          │
│  if (isEnabled()) {      │
│    if (!isDryRun()) {    │
│      if (isInRunWindow()){
│        // Do work         │
│      }                    │
│    }                      │
│  }                        │
└──────────────────────────┘
```

---

## Logging Flow

```
Application Code generates events
         │
         ▼
┌─────────────────────────────────────────┐
│           Logger.js                     │
│                                         │
│  logRun(metrics)      ─────► Runs_Log  │
│  logMessage(msg)      ─────► Msgs_Log  │
│  logBounce(bounce)    ─────► Bounces   │
│  logTicket(ticket)    ─────► Tickets   │
│  logError(context)    ─────► Errors    │
│                                         │
│  Features:                              │
│  • Automatic timestamps                 │
│  • Data truncation                      │
│  • Idempotency (Tickets)               │
│  • Formatted output                     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Google Sheet Tabs      │
│  (Persistent Storage)   │
└─────────────────────────┘
```

---

## Rule Matching Flow (KB)

```
┌──────────────────┐
│  Message Data    │
│  • from          │
│  • subject       │
│  • body          │
│  • labels        │
│  • hasAttachment │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  KnowledgeBase.js                           │
│                                             │
│  findMatchingRule(kb, messageData)          │
│    │                                        │
│    ├─► 1. Check DENYLIST                   │
│    │     └─ Match? → { action: 'skip' }    │
│    │                                        │
│    ├─► 2. Check RULES                      │
│    │     └─ Match? → { action: {...} }     │
│    │                                        │
│    ├─► 3. Check ALLOWLIST                  │
│    │     └─ Match? → { action: 'ticket' }  │
│    │                                        │
│    └─► 4. No Match → return null           │
│                      (LLM in future phase)  │
└─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Action Object   │
│  • type          │
│  • priority      │
│  • category      │
│  • reply_hint    │
│  • source        │
└──────────────────┘
```

---

## Security Model

```
┌────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Layer 1: Google OAuth                                │
│  ├─► User authorization required                      │
│  ├─► Scopes: gmail.modify, spreadsheets               │
│  └─► Script runs as authorized user                   │
│                                                        │
│  Layer 2: Script Properties (Encrypted)               │
│  ├─► openai_api_key     (never logged)               │
│  ├─► mythoria_api_token (never logged)               │
│  └─► mythoria_api_base  (endpoint only)              │
│                                                        │
│  Layer 3: Data Privacy                                │
│  ├─► Message bodies truncated in logs                │
│  ├─► Only metadata stored in Sheet                   │
│  └─► No PII in execution logs                        │
│                                                        │
│  Layer 4: Access Control                              │
│  ├─► Sheet owned by hello@mythoria.pt               │
│  ├─► Script bound to Sheet (same permissions)        │
│  └─► Script Properties per-user isolated             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Testing Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Test.js                            │
│              testPhase1()                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Phase 1: Config Test                               │
│  ┌────────────────────────────────────┐            │
│  │ loadConfig()                       │            │
│  │ ├─► Verify Config tab exists      │            │
│  │ ├─► Parse configuration            │            │
│  │ └─► Check required keys            │            │
│  └────────────────────────────────────┘            │
│         │                                           │
│         ├─► ✓ PASS / ✗ FAIL                        │
│                                                      │
│  Phase 2: KB Test                                   │
│  ┌────────────────────────────────────┐            │
│  │ loadKnowledgeBase()                │            │
│  │ ├─► Parse JSON                     │            │
│  │ ├─► Validate structure             │            │
│  │ └─► Count rules                    │            │
│  └────────────────────────────────────┘            │
│         │                                           │
│         ├─► ✓ PASS / ✗ FAIL                        │
│                                                      │
│  Phase 3: Logs Test                                 │
│  ┌────────────────────────────────────┐            │
│  │ Write to all 5 log tabs            │            │
│  │ ├─► logRun()                       │            │
│  │ ├─► logMessage()                   │            │
│  │ ├─► logBounce()                    │            │
│  │ ├─► logTicket()                    │            │
│  │ └─► logError()                     │            │
│  └────────────────────────────────────┘            │
│         │                                           │
│         ├─► ✓ PASS / ✗ FAIL                        │
│                                                      │
│  Phase 4: Script Properties (Non-blocking)          │
│  Phase 5: Gmail Labels (Non-blocking)               │
│                                                      │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Test Results        │
│  • Logger output     │
│  • UI dialog         │
│  • Test data in logs │
└──────────────────────┘
```

---

## Future Architecture (Phase 2+)

```
┌─────────────────────────────────────────────────────────┐
│                    FUTURE PHASES                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 2: Fetch & Cache                                │
│  ├─► Time-driven trigger (every N minutes)            │
│  ├─► Fetch unread Gmail threads                       │
│  ├─► CacheService for idempotency                     │
│  └─► Skeleton run loop                                 │
│                                                         │
│  Phase 3: Bounce Handling                              │
│  ├─► DSN detection (headers + body)                   │
│  ├─► Hard vs Soft bounce classification               │
│  ├─► Call Mythoria Bounce API                         │
│  └─► Label & log bounces                              │
│                                                         │
│  Phase 4: KB Rules Triage                              │
│  ├─► Evaluate denylist → rules → allowlist           │
│  ├─► First match wins                                  │
│  └─► Skip, ticket, or priorityOnly actions            │
│                                                         │
│  Phase 5: LLM Classification                           │
│  ├─► OpenAI Responses API integration                 │
│  ├─► GPT-4o-mini for classification (cheap)          │
│  ├─► Structured outputs (JSON schema)                 │
│  └─► Fallback for inconclusive KB matches             │
│                                                         │
│  Phase 6: Ticket Creation                              │
│  ├─► Mythoria Admin API integration                   │
│  ├─► Idempotent ticket upsert (by threadId)          │
│  ├─► Label threads with Mythoria/Ticketed            │
│  └─► Store ticketId in Tickets tab                    │
│                                                         │
│  Phase 7: Draft Reply Generation                       │
│  ├─► Escalate to larger model (GPT-4o)               │
│  ├─► Generate summary + reply_html                    │
│  ├─► Create Gmail Draft in-thread                     │
│  └─► Log draftId                                       │
│                                                         │
│  Phase 8: Production Polish                            │
│  ├─► Controls: enabled, dry_run, batch_size          │
│  ├─► Respect run_window and tz                        │
│  ├─► Rate limiting & quotas                           │
│  ├─► Error handling & retries                         │
│  └─► Testing & QA                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

Generated: November 1, 2025
Version: 1.0.0
Phase: 1 Complete ✓
