# Source Code Reference

## Core Runtime

### [src/Code.js](../src/Code.js)

- shared Apps Script helpers
- menu registration
- secure Script Property guidance
- script execution lock acquisition and release
- manual run and debug entry points

### [src/Config.js](../src/Config.js)

Single source of truth for non-secret settings.

Notable settings:

- `enabled`
- `dry_run`
- `batch_size`
- `run_window`
- `openai_model_classify`
- `openai_model_draft`
- `cache_ttl`
- `lock_timeout_ms`
- DMARC settings

### [src/Processor.js](../src/Processor.js)

Main inbox processor.

Current behavior:

- respects `enabled` and run-window checks
- fetches inbox threads
- skips cached threads
- rejects messages older than the configured age
- handles bounce processing first
- logs non-bounce messages as placeholder `phase2` records
- runs DMARC processing in the same execution

Planned behavior in this file:

- KB triage for non-bounce messages
- LLM classification
- ticket creation
- draft generation

## Gmail and Idempotency

### [src/Fetcher.js](../src/Fetcher.js)

- fetches inbox threads
- extracts thread metadata
- normalizes run-window checks via `Config.js`

### [src/Cache.js](../src/Cache.js)

- `isProcessed(threadId)`
- `markProcessed(threadId)`
- cache stats and cache clear helpers

## Bounce and DMARC

### [src/BounceHandler.js](../src/BounceHandler.js)

- bounce detection heuristics
- SMTP status parsing
- recipient extraction
- Mythoria bounce API request
- Gmail label, archive, and mark-read handling

### [src/DmarcParser.js](../src/DmarcParser.js)

- DMARC XML parsing and metric extraction

### [src/DmarcProcessor.js](../src/DmarcProcessor.js)

- fetches unread `Mythoria/DMARC` messages
- extracts XML, `.gz`, and `.zip` attachments
- updates `DMARC_Health`
- caches processed DMARC message ids

## KB Runtime

### [src/kb.json](../src/kb.json)

Editable Knowledge Base source.

### [src/KbData.js](../src/KbData.js)

Generated payload for Apps Script runtime. Do not edit manually.

### [src/KnowledgeBase.js](../src/KnowledgeBase.js)

- loads the generated KB payload
- validates structure
- matches denylist, rules, and allowlist

## Setup and Maintenance

### [src/Initialize.js](../src/Initialize.js)

- creates logging sheets
- creates Gmail labels

### [src/Triggers.js](../src/Triggers.js)

- creates time-driven triggers
- removes existing duplicates before install
- exposes trigger status to the sheet UI

### [src/Test.js](../src/Test.js)

- setup validation
- phase 2 fetch/cache checks
- phase 3 bounce checks
