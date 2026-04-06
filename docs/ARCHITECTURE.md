# Architecture

## Runtime Model

This is a Google Apps Script project bound to a single Google Sheet.

- Gmail is the message source
- the bound Sheet stores logs and health data
- Script Properties store secrets
- `Config.js` stores non-secret runtime configuration
- `kb.json` is the editable KB source, compiled into `KbData.js` for GAS runtime use

## Execution Flow

```text
Time-driven trigger or manual run
  -> acquire script lock
  -> check enabled and run window
  -> fetch inbox threads
  -> skip cached threads
  -> skip old messages
  -> bounce detection and bounce handling
  -> placeholder log for regular messages
  -> DMARC report processing
  -> log run metrics
  -> release script lock
```

## Current Inboxes and Data Paths

### Regular inbox processing

- Gmail query comes from `Fetcher.js`
- thread idempotency uses `CacheService`
- bounce handling happens before any future KB or LLM path
- regular non-bounce messages are currently logged only

### DMARC processing

- fetch unread messages with `Mythoria/DMARC`
- parse attachments
- aggregate metrics into `DMARC_Health`
- cache DMARC message ids separately

## Locking and Safety

The project uses `LockService.getScriptLock()` at run start.

Purpose:

- avoid overlapping trigger executions
- protect Gmail state transitions
- reduce duplicate sheet writes
- keep DMARC and inbox processing from racing

If the lock cannot be acquired inside `lock_timeout_ms`, the run logs `status = locked` and exits safely.

## Configuration Boundaries

### Editable in code

- [src/Config.js](../src/Config.js)
- [src/kb.json](../src/kb.json)

### Editable in Apps Script UI

- Script Properties secrets
- trigger installation

### Editable in the bound Sheet

- operational logs only

## Current vs Planned Scope

Implemented now:

- fetch and cache
- bounce pipeline
- DMARC pipeline
- setup and trigger tooling

Planned next:

- use KB rules for normal messages in `Processor.js`
- call OpenAI for structured classification when KB is inconclusive
- create Mythoria tickets for qualifying messages
- draft Gmail replies for selected priorities
