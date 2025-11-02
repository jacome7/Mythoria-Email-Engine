# DMARC Processing Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Time-Driven Trigger                       │
│                    (Every N minutes)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  runEmailEngine()                            │
│                  (Code.js)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              processMessages()                               │
│              (Main Email Triage)                             │
│              ├─ Fetch inbox threads                          │
│              ├─ Check bounces                                │
│              ├─ Apply KB rules                               │
│              ├─ LLM classification                           │
│              ├─ Create tickets                               │
│              └─ Generate drafts                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           processDmarcReports() ◄── NEW FEATURE              │
│           (DMARC Processing)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
                See detailed flow below
```

## DMARC Processing Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Check Configuration                                      │
│     • dmarc_enabled = true?                                  │
│     • Get batch_size, dry_run                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Fetch Messages                                           │
│     • Query: label:Mythoria/DMARC is:unread                 │
│     • Return up to batch_size messages                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. For Each Message:                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3a. Check Cache                                             │
│      • Key: dmarc:messageId                                  │
│      • If exists → Skip (already processed)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3b. Extract Attachments                                     │
│      • Get all attachments                                   │
│      • For each attachment:                                  │
│        ├─ If .xml → Use directly                             │
│        ├─ If .gz/.gzip → Utilities.ungzip()                  │
│        └─ If .zip → Utilities.unzip()                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3c. Parse XML (DmarcParser.js)                              │
│      • XmlService.parse(xmlContent)                          │
│      • Extract metadata:                                     │
│        ├─ org_name                                           │
│        ├─ report_id                                          │
│        ├─ date_range (begin/end)                             │
│        └─ domain                                             │
│      • Extract records:                                      │
│        ├─ source_ip, count, disposition                      │
│        ├─ SPF result & alignment                             │
│        ├─ DKIM result & alignment                            │
│        └─ DMARC pass (SPF OR DKIM aligned)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3d. Calculate Metrics                                       │
│      • Aggregate across all records:                         │
│        ├─ total_msgs (sum of counts)                         │
│        ├─ dmarc_pass_rate (%)                                │
│        ├─ spf_aligned_pass_rate (%)                          │
│        ├─ dkim_aligned_pass_rate (%)                         │
│        ├─ quarantine_count                                   │
│        └─ reject_count                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3e. Calculate Health Status                                 │
│      • ACTION if:                                            │
│        ├─ reject_count > 0                                   │
│        └─ dmarc_pass_rate < 90%                              │
│      • WATCH if:                                             │
│        ├─ quarantine_count > 0                               │
│        ├─ dmarc_pass_rate 90-98%                             │
│        ├─ spf_aligned_pass_rate < 95%                        │
│        └─ dkim_aligned_pass_rate < 95%                       │
│      • OK otherwise                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3f. Update Sheet (DMARC_Health)                             │
│      • Search for existing row:                              │
│        WHERE date = end_date AND domain = domain             │
│      • If found → Overwrite row (latest wins)                │
│      • If not found → Append new row                         │
│      • Row contains:                                         │
│        [date, domain, total_msgs, dmarc_pass_rate,           │
│         quarantine_count, reject_count,                      │
│         spf_aligned_pass_rate, dkim_aligned_pass_rate,       │
│         health_status, health_note]                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3g. Cleanup                                                 │
│      • Mark message as read                                  │
│      • Mark in cache: dmarc:messageId (TTL: 6hrs)            │
│      • If dmarc_delete_after_processing:                     │
│        └─ message.moveToTrash()                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Log Summary                                              │
│     • processed: N                                           │
│     • health_rows_updated: M                                 │
│     • errors: E                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### Parsed Report Object
```javascript
{
  metadata: {
    org_name: "google.com",
    report_id: "12345...",
    begin_date: Date,
    end_date: Date,          // ← Used as "date" in sheet
    domain: "mythoria.pt",
    policy: "none"
  },
  records: [
    {
      source_ip: "1.2.3.4",
      count: 100,
      disposition: "none",
      dmarc_pass: true,      // SPF OR DKIM aligned
      spf_aligned: true,
      dkim_aligned: true,
      header_from: "mythoria.pt"
    },
    // ... more records
  ],
  metrics: {
    total_msgs: 1250,
    dmarc_pass_rate: 98.5,
    spf_aligned_pass_rate: 97.8,
    dkim_aligned_pass_rate: 98.2,
    quarantine_count: 0,
    reject_count: 0
  }
}
```

### Sheet Row Format
```javascript
[
  "2025-11-01",           // date (YYYY-MM-DD)
  "mythoria.pt",          // domain
  1250,                   // total_msgs
  98.5,                   // dmarc_pass_rate
  0,                      // quarantine_count
  0,                      // reject_count
  97.8,                   // spf_aligned_pass_rate
  98.2,                   // dkim_aligned_pass_rate
  "OK",                   // health_status
  "All metrics healthy"   // health_note
]
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│  Error Occurs                            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Log to Errors Sheet                     │
│  • Timestamp                             │
│  • Context (DMARC_*)                     │
│  • Error message                         │
│  • Details (messageId, etc.)             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Mark Message as Read                    │
│  (Prevents reprocessing)                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Continue with Next Message              │
└─────────────────────────────────────────┘
```

## Cache Strategy

```
Processing Message ID: abc123
    ↓
Check CacheService.get("dmarc:abc123")
    ↓
    ├─ Found → Skip (already processed within 6hrs)
    │
    └─ Not Found → Process
           ↓
       Parse & Update
           ↓
       CacheService.put("dmarc:abc123", timestamp, 21600)
           ↓
       Sheet: Check for existing date×domain row
           ↓
           ├─ Found → Overwrite
           └─ Not Found → Append
```

## Integration Points

```
┌──────────────────────┐
│   Main Engine        │
│   processMessages()  │
└──────────┬───────────┘
           │
           │ (after email triage)
           │
           ▼
┌──────────────────────┐
│   DMARC Processor    │
│   processDmarcReports()│
└──────────┬───────────┘
           │
           ├─ DmarcParser.parseDmarcReportXml()
           ├─ DmarcParser.calculateMetrics()
           ├─ DmarcParser.calculateHealthStatus()
           └─ Logger.updateDmarcHealth()
```

## File Dependencies

```
DmarcProcessor.js
    ↓ calls
    ├─ DmarcParser.js (parsing & metrics)
    ├─ Cache.js (getCacheService)
    ├─ Code.js (getOrCreateSheet)
    ├─ Config.js (getConfigValue, getConfigBoolean, getConfigNumber)
    └─ Logger.js (logError)

Processor.js
    ↓ calls
    └─ DmarcProcessor.processDmarcReports()

Initialize.js
    ↓ creates
    └─ DMARC_Health sheet
```

---

**Visual Key:**
- `→` Sequential flow
- `├─` Branch/option
- `└─` Terminal branch
- `◄──` New feature indicator
- `▼` Continuation
