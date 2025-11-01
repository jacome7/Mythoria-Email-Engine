# Source Code Documentation

## 📁 File Overview

### Core Files

#### **appsscript.json**
Apps Script manifest file that defines:
- Runtime version (V8)
- OAuth scopes (Gmail, Sheets, External requests)
- Timezone (Europe/Lisbon)
- Advanced services configuration

**Key scopes:**
```json
"gmail.modify"         // Read and label emails
"gmail.compose"        // Create draft replies
"spreadsheets"         // Read/write Sheet data
"script.external_request" // Call OpenAI and Mythoria APIs
```

---

#### **Code.js**
Main entry point and utility functions.

**Key Functions:**
- `onOpen()` - Creates custom menu in Sheet UI
- `getSpreadsheet()` - Returns bound spreadsheet
- `getScriptProperty()` - Reads secure Script Properties
- `setScriptProperties()` - One-time setup for API keys
- `showConfig()` - Displays current configuration
- `showKBSummary()` - Shows KB statistics

**Custom Menu Items:**
- Initialize Sheet Tabs
- Initialize Gmail Labels
- Test Phase 1
- View Config
- View KB Summary

---

#### **Initialize.js**
One-time setup functions for Sheet tabs and Gmail labels.

**Key Functions:**

**`initializeSheetTabs()`**
Creates all 6 log tabs with beautiful formatting:
- **Config** (blue headers) - Configuration key-value pairs
- **Runs_Log** (green) - Execution metrics per run
- **Messages_Log** (yellow) - Individual message processing records
- **Bounces** (red) - Bounce notification details
- **Tickets** (purple) - Ticket creation/update records
- **Errors** (orange) - Error tracking and debugging

Each function (`initializeConfigTab()`, `initializeRunsLogTab()`, etc.):
- Creates/clears the sheet
- Sets column headers
- Applies color formatting
- Sets column widths
- Freezes header row
- Adds default data (Config only)

**`initializeGmailLabels()`**
Creates Gmail labels from Config settings:
- Mythoria/Ticketed
- Mythoria/Bounce
- Mythoria/No-Action
- Mythoria/Needs-Review

Handles existing labels gracefully and reports results.

---

#### **ConfigManager.js**
Configuration management system - reads from Config Sheet tab.

**Key Functions:**

**`loadConfig()`** - Returns complete config object
```javascript
const config = loadConfig();
// { enabled: 'true', batch_size: '20', ... }
```

**`getConfig(key, defaultValue)`** - Get single value as string
```javascript
const tz = getConfig('tz', 'UTC');
```

**`getConfigBoolean(key, defaultValue)`** - Get as boolean
```javascript
const enabled = getConfigBoolean('enabled', true);
```

**`getConfigNumber(key, defaultValue)`** - Get as number
```javascript
const batchSize = getConfigNumber('batch_size', 20);
```

**`getConfigArray(key, defaultValue)`** - Parse comma-separated
```javascript
const priorities = getConfigArray('draft_priorities', []);
// ['P0', 'P1', 'P2']
```

**Helper Functions:**
- `isEnabled()` - Check if engine is enabled
- `isDryRun()` - Check if in test mode
- `isInRunWindow()` - Check if current time is within operating hours
- `getOpenAIKey()` - Get OpenAI key from Script Properties
- `getMythoriaBase()` - Get Mythoria API URL
- `getMythoriaToken()` - Get Mythoria token

---

#### **Logger.js**
Logging system - writes to all Sheet log tabs.

**Key Functions:**

**`logRun(metrics)`** - Log execution to Runs_Log
```javascript
logRun({
  duration: 2.5,
  processed: 10,
  ticketed: 5,
  bounced: 1,
  skipped: 4,
  drafted: 3,
  warnings: 0,
  errors: 0,
  status: 'completed'
});
```

**`logMessage(message)`** - Log message processing to Messages_Log
```javascript
logMessage({
  threadId: 'thread_123',
  messageId: 'msg_456',
  from: 'user@example.com',
  subject: 'Help request',
  category: 'support',
  priority: 'P2',
  action: 'ticket',
  source: 'KB:general_support',
  ticketId: 'TKT-789',
  draftId: 'draft_xyz',
  labels: 'Mythoria/Ticketed'
});
```

**`logBounce(bounce)`** - Log bounce to Bounces tab
```javascript
logBounce({
  threadId: 'thread_123',
  messageId: 'msg_456',
  recipient: 'bad@email.com',
  statusCode: '5.1.1',
  bounceType: 'hard',
  reason: 'User unknown',
  apiResponse: 'Success',
  status: 'logged'
});
```

**`logTicket(ticket)`** - Log ticket to Tickets tab (idempotent)
```javascript
logTicket({
  threadId: 'thread_123',
  ticketId: 'TKT-789',
  category: 'support',
  priority: 'P2',
  status: 'open'
});
```

**`logError(context, message, details, retryCount)`** - Log error
```javascript
logError('OPENAI_API', 'Rate limit exceeded', {
  endpoint: '/v1/chat/completions',
  statusCode: 429
}, 1);
```

**Helper Functions:**
- `getTicketIdByThreadId(threadId)` - Find existing ticket
- `truncate(str, maxLength)` - Limit string length
- `clearLogs(tabName)` - Clear log data (caution!)

---

#### **KnowledgeBase.js**
Knowledge Base loader and rule matching system.

**Key Functions:**

**`loadKnowledgeBase()`** - Load and parse KB JSON
```javascript
const kb = loadKnowledgeBase();
// { version: '1.0', denylist: [...], rules: [...], allowlist: [...] }
```

**`findMatchingRule(kb, messageData)`** - Find first matching rule
```javascript
const match = findMatchingRule(kb, {
  from: 'user@example.com',
  subject: 'Urgent: Site is down',
  body: 'Help! Emergency!',
  labels: [],
  hasAttachment: false
});
// Returns: { action: {...}, source: 'rule_id', notes: '...' }
```

**Rule Processing Order:**
1. **Denylist** - Skip patterns (e.g., noreply addresses)
2. **Rules** - Main processing rules
3. **Allowlist** - Force-ticket patterns

**Matching Logic:**
- Supports regex patterns with flags
- Multiple scopes: from, from_domain, from_local, subject, body, label, has_attachment
- Complex rules with multiple match conditions (AND logic)

**KB Structure:**
```javascript
{
  "version": "1.0",
  "denylist": [
    {
      "scope": "from_domain",
      "pattern": "noreply\\.example\\.com",
      "flags": "i",
      "action": "skip"
    }
  ],
  "rules": [
    {
      "id": "urgent_support",
      "match": [
        { "scope": "subject", "pattern": "(urgent|emergency)", "flags": "i" }
      ],
      "action": {
        "type": "ticket",
        "priority": "P0",
        "category": "support"
      }
    }
  ],
  "allowlist": [...]
}
```

**Helper Functions:**
- `validateKBStructure(kb)` - Validate KB format
- `getTotalRules(kb)` - Count all rules
- `matchesRule(rule, messageData)` - Check single rule
- `matchesPattern(scope, pattern, flags, data)` - Check pattern
- `getValueByScope(scope, data)` - Extract field value
- `extractDomain(email)` - Get domain from email
- `extractLocal(email)` - Get local part from email

**Note:** For Phase 1, KB is embedded in the code. Future phases can migrate to Drive.

---

#### **Test.js**
Phase 1 validation and testing functions.

**Key Functions:**

**`testPhase1()`** - Comprehensive Phase 1 test suite

Tests performed:
1. **Config Read** - Verify Config tab loads
2. **KB Load** - Verify KB JSON parses correctly
3. **Logs Write** - Test writing to all 5 log tabs
4. **Script Properties** - Check API keys are set
5. **Gmail Labels** - Verify all 4 labels exist

Returns: `true` if all tests pass, `false` otherwise

Displays results via:
- Logger (execution log)
- UI dialog (success/failure summary)

**`cleanupTestData()`** - Remove test entries from logs
- Confirms with user before deleting
- Clears all log tabs except headers
- Use after successful test

---

## 🔄 Data Flow

### Configuration Flow
```
Config Sheet Tab → loadConfig() → ConfigManager → Application Code
Script Properties → getScriptProperty() → Secure API Keys
```

### Logging Flow
```
Application Code → Logger functions → Sheet Log Tabs
- logRun() → Runs_Log
- logMessage() → Messages_Log
- logBounce() → Bounces
- logTicket() → Tickets
- logError() → Errors
```

### Rule Matching Flow
```
Email Data → findMatchingRule() → KB Rules → Action
1. Check Denylist (skip?)
2. Check Rules (action?)
3. Check Allowlist (force ticket?)
4. No match → LLM (future phase)
```

---

## 🎨 Color Coding

Sheet tabs use color-coded headers for quick identification:

| Tab | Color | Purpose |
|-----|-------|---------|
| Config | Blue (#4285F4) | Configuration |
| Runs_Log | Green (#34A853) | Success metrics |
| Messages_Log | Yellow (#FBBC04) | Processing details |
| Bounces | Red (#EA4335) | Error notifications |
| Tickets | Purple (#9C27B0) | Ticket tracking |
| Errors | Orange (#FF6D00) | Error logging |

---

## 🔐 Security

### Script Properties (Secure Storage)
Sensitive data stored via PropertiesService:
- `openai_api_key` - Never logged or displayed
- `mythoria_api_token` - Never logged or displayed
- `mythoria_api_base` - API endpoint

### Privacy
- Message bodies are truncated in logs
- Full emails never stored in Sheet
- Only metadata and snippets logged

---

## 🧪 Testing

Run tests via:
1. **Custom Menu**: 🔧 Mythoria Email Engine → Test Phase 1
2. **Script Editor**: Select `testPhase1()` and click Run
3. **Programmatically**: `testPhase1()`

View results:
- Execution log (Apps Script editor)
- UI dialog (shows pass/fail summary)
- Log tabs (test data written)

Clean up:
- Run `cleanupTestData()` to remove test entries

---

## 📊 Knowledge Base Rules (Phase 1)

Current KB has **9 rules**:

### Denylist (2 rules)
- Skip noreply domains
- Skip automated addresses

### Rules (7 rules)
1. **bounce_detection** - DSN detection → bounce handler
2. **billing_priority** - Billing/invoice → P2 ticket
3. **urgent_support** - Urgent/emergency → P0 ticket
4. **general_support** - Help/support → P3 ticket
5. **sales_inquiry** - Pricing/demo → P2 ticket
6. **legal_compliance** - GDPR/legal → P1 ticket
7. **abuse_report** - Abuse/spam → P1 ticket

### Allowlist (1 rule)
- Trusted partner domain → P2 ticket

---

## 🚀 Future Enhancements

### Phase 2+
- Email fetching from Gmail
- CacheService for idempotency
- OpenAI API integration
- Mythoria Admin API integration
- Draft reply generation
- Scheduled triggers

### Improvements
- Migrate KB from embedded to Drive
- Add more sophisticated rule matching
- Implement retry logic
- Add rate limiting
- Enhance error handling

---

## 📝 Code Style

- **Comments**: JSDoc format for functions
- **Naming**: camelCase for functions, UPPER_CASE for constants
- **Error Handling**: Try-catch with logError()
- **Logging**: Comprehensive Logger.log() statements
- **Validation**: Check inputs before processing

---

## 🔧 Maintenance

### Updating Configuration
Edit the Config tab in the Sheet - no code changes needed.

### Updating KB Rules
Currently: Edit `getEmbeddedKB()` in KnowledgeBase.js
Future: Edit kb.json in Drive

### Updating API Keys
Run `setScriptProperties()` again with new values.

### Viewing Logs
Check Sheet tabs or Apps Script execution log.

---

## 📚 Additional Documentation

- **QUICKSTART.md** - Step-by-step setup guide
- **SETUP.md** - Detailed setup instructions
- **README.md** - Full project documentation
- **AGENTS.md** - AI coding agent guidelines
