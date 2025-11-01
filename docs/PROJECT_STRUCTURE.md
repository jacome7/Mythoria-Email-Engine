# Mythoria Email Engine - Project Structure

## 📁 Directory Structure

```
Mythoria-Email-Engine/
├── .clasp.json                 # Apps Script project configuration
├── .claspignore               # Files to exclude from push
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies
├── README.md                  # Main project documentation
├── AGENTS.md                  # AI agent instructions
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── CHECKLIST.md          # Project checklist
│   ├── PHASE1_COMPLETE.md    # ✅ Phase 1 documentation
│   ├── PHASE2_COMPLETE.md    # ✅ Phase 2 documentation
│   ├── PHASE2_QUICKSTART.md  # Phase 2 quick start
│   ├── QUICKSTART.md         # General quick start
│   ├── SETUP.md              # Setup instructions
│   └── SOURCE_CODE.md        # Source code reference
│
└── src/                       # Source code (pushed to Apps Script)
    ├── appsscript.json       # Apps Script manifest
    ├── Code.js               # Main entry point + utilities
    ├── Config.js             # ✅ Configuration (single source of truth)
    ├── Initialize.js         # Sheet + Gmail setup
    ├── KnowledgeBase.js      # KB loader + embedded kb.json
    ├── Logger.js             # Logging to Sheet tabs
    ├── Cache.js              # ✅ CacheService idempotency
    ├── Fetcher.js            # ✅ Gmail fetch operations
    ├── Processor.js          # ✅ Main processing loop
    ├── Triggers.js           # ✅ Trigger management
    └── Test.js               # ✅ Phase 1 & 2 tests
```

---

## 📊 Google Sheet Structure

```
Mythoria Email Engine (Spreadsheet)
├── Config                    # (DEPRECATED - use Config.js instead)
├── Runs_Log                 # ✅ Execution metrics per run
├── Messages_Log             # ✅ One row per processed thread
├── Bounces                  # Bounce notifications (Phase 3)
├── Tickets                  # Ticket tracking (Phase 6)
└── Errors                   # ✅ Error logging
```

---

## 🏷️ Gmail Labels

```
Mythoria/
├── Ticketed                 # Ticket created (Phase 6)
├── Bounce                   # Bounce detected (Phase 3)
├── No-Action               # Skipped/ignored
└── Needs-Review            # Manual review needed
```

---

## 🔧 Configuration Flow

```
Config.js (Code)
    ↓
getConfig()
    ↓
getConfigValue(key)
    ↓
Used by all modules
```

**Note:** Config Sheet tab is deprecated. All config is in `src/Config.js`.

---

## 🔄 Processing Flow (Phase 2)

```
Time Trigger (10 min)
    ↓
runEmailEngine() [Code.js]
    ↓
processMessages() [Processor.js]
    ↓
├─ shouldRun()
│   ├─ Check: enabled? [Config.js]
│   └─ Check: run_window? [Fetcher.js]
│
├─ fetchUnreadThreads() [Fetcher.js]
│   ├─ Gmail query: "in:inbox is:unread"
│   └─ Limit: batch_size
│
└─ For each thread:
    ├─ isProcessed()? [Cache.js]
    │   YES → Skip
    │   NO  → Continue
    │
    ├─ extractThreadMetadata() [Fetcher.js]
    ├─ logMessage() [Logger.js]
    └─ markProcessed() [Cache.js]
```

---

## 📦 Module Responsibilities

### Core Modules (Phase 1)
- **Code.js**: Entry points, utilities, menu
- **Config.js**: All configuration settings
- **Initialize.js**: Sheet tabs + Gmail labels setup
- **KnowledgeBase.js**: KB rules engine (embedded JSON)
- **Logger.js**: Write to Sheet tabs
- **Test.js**: Validation tests

### Phase 2 Modules
- **Cache.js**: CacheService operations (idempotency)
- **Fetcher.js**: Gmail API operations (fetch, parse)
- **Processor.js**: Main orchestration loop
- **Triggers.js**: Time-driven trigger management

### Future Modules (Phase 3+)
- **Bounce.js**: DSN detection + classification
- **Ticket.js**: Mythoria admin API integration
- **Draft.js**: Gmail draft creation
- **OpenAI.js**: LLM classification + generation

---

## 🔑 Key Design Decisions

### 1. Configuration in Code (Not Sheet)
- **Why:** Easier version control, type safety, IDE support
- **Sheet:** Deprecated (kept for backward compat)
- **Location:** `src/Config.js`

### 2. Knowledge Base Embedded
- **Why:** Simple deployment, no Drive dependencies
- **Format:** JSON embedded in `KnowledgeBase.js`
- **Future:** Could externalize to Drive if needed

### 3. Thread-Level Caching
- **Why:** Simpler than message-level, sufficient for v1
- **Key:** `processed:{threadId}`
- **TTL:** 6 hours (max GAS allows)
- **Durable:** Sheet-based deduplication in Phase 6

### 4. Dry Run Mode
- **Why:** Safe testing without side effects
- **Behavior:** Fetch but don't cache
- **Toggle:** `dry_run: true` in Config.js

### 5. Run Window
- **Why:** Respect business hours
- **Format:** "HH:mm-HH:mm" or empty (always)
- **Check:** Before every run

---

## 📈 Metrics & Observability

### Runs_Log
```javascript
{
  timestamp: '2025-11-01 14:30:00',
  duration: 2.5,        // seconds
  processed: 5,         // threads processed
  ticketed: 0,          // Phase 6
  bounced: 0,           // Phase 3
  skipped: 15,          // cached or too old
  drafted: 0,           // Phase 7
  warnings: 0,
  errors: 0,
  status: 'completed'   // or 'error', 'skipped'
}
```

### Messages_Log
```javascript
{
  timestamp: '2025-11-01 14:30:01',
  threadId: '18b1a2c3d4e5f6g7',
  messageId: '18b1a2c3d4e5f6g8',
  from: 'user@example.com',
  subject: 'Need help with...',
  category: '',         // Phase 4+
  priority: '',         // Phase 4+
  action: 'fetched',    // Phase 2
  source: 'phase2',     // KB rule ID or 'LLM'
  ticketId: '',         // Phase 6
  draftId: '',          // Phase 7
  labels: ''            // Gmail labels
}
```

---

## 🧪 Testing Strategy

### Phase 1 Test (`testPhase1`)
- ✅ Config read from Config.js
- ✅ KB load from embedded JSON
- ✅ Logs write to all tabs

### Phase 2 Test (`testPhase2`)
- ✅ Cache operations (mark/check/clear)
- ✅ Run window check
- ✅ Gmail fetch
- ✅ No reprocessing (deduplication)

### Manual Testing
- Run Email Engine (Manual) - Menu option
- Check logs after run
- Verify metrics in Runs_Log

---

## 🚀 Deployment Process

### 1. Local Development
```powershell
# Edit files in src/
code src/Code.js

# Test locally with clasp
clasp push
```

### 2. Test in Apps Script
```javascript
// Apps Script Editor
testPhase2()  // Validate functionality
```

### 3. Manual Run
```
Google Sheet → Menu → Run Email Engine (Manual)
```

### 4. Install Trigger
```
Google Sheet → Menu → Triggers → Install (Every 10 min)
```

### 5. Monitor
- Check Runs_Log every 10 minutes
- Review Errors tab if issues
- Adjust config as needed

---

## 🔐 Security Model

### Script Properties (Secure)
```javascript
// Stored in Apps Script (encrypted)
openai_api_key
mythoria_api_token
mythoria_api_base
```

### Config.js (Code)
```javascript
// Non-sensitive settings
enabled, batch_size, run_window, etc.
```

### OAuth Scopes
```json
[
  "gmail.modify",          // Read/label threads
  "gmail.compose",         // Create drafts (Phase 7)
  "spreadsheets",          // Read/write Sheet
  "script.external_request", // Call APIs
  "script.scriptapp"       // Manage triggers
]
```

---

## 📊 Phase Status

| Phase | Status | Files | Tests |
|-------|--------|-------|-------|
| 1 - Bootstrap | ✅ COMPLETE | 7 files | ✅ testPhase1 |
| 2 - Fetch & Cache | ✅ COMPLETE | +4 files | ✅ testPhase2 |
| 3 - Bounce Handling | 🔜 NEXT | TBD | TBD |
| 4 - KB Rules Triage | 📋 PLANNED | TBD | TBD |
| 5 - LLM Classification | 📋 PLANNED | TBD | TBD |
| 6 - Ticket Creation | 📋 PLANNED | TBD | TBD |
| 7 - Draft Reply | 📋 PLANNED | TBD | TBD |
| 8 - Controls & QA | 📋 PLANNED | TBD | TBD |

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Main project documentation |
| [AGENTS.md](../AGENTS.md) | AI agent instructions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md) | Phase 1 details |
| [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md) | Phase 2 details |
| [PHASE2_QUICKSTART.md](PHASE2_QUICKSTART.md) | Phase 2 quick start |
| [QUICKSTART.md](QUICKSTART.md) | General quick start |
| [SETUP.md](SETUP.md) | Setup instructions |
| [SOURCE_CODE.md](SOURCE_CODE.md) | Source code reference |

---

**Last Updated:** 2025-11-01 (Phase 2 Complete)
**Next Milestone:** Phase 3 - Bounce Handling
