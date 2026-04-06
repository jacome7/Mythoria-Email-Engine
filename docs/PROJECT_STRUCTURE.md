# Project Structure

## Repository

```text
Mythoria-Email-Engine/
|-- .clasp.json
|-- .claspignore
|-- AGENTS.md
|-- README.md
|-- package.json
|-- scripts/
|   `-- sync-kb.cjs
|-- docs/
|   |-- RUNBOOK.md
|   |-- QUICKSTART.md
|   |-- SETUP.md
|   |-- ARCHITECTURE.md
|   |-- PROJECT_STRUCTURE.md
|   |-- SOURCE_CODE.md
|   `-- CHECKLIST.md
`-- src/
    |-- appsscript.json
    |-- Code.js
    |-- Config.js
    |-- Initialize.js
    |-- Logger.js
    |-- Cache.js
    |-- Fetcher.js
    |-- Processor.js
    |-- BounceHandler.js
    |-- DmarcParser.js
    |-- DmarcProcessor.js
    |-- Triggers.js
    |-- Test.js
    |-- KnowledgeBase.js
    |-- kb.json
    `-- KbData.js
```

## Ownership and Source of Truth

- [src/Config.js](../src/Config.js): non-secret runtime configuration
- [src/kb.json](../src/kb.json): editable Knowledge Base source
- [src/KbData.js](../src/KbData.js): generated GAS payload from `src/kb.json`
- Script Properties: secret configuration
- Bound Google Sheet: logs, ticket index, DMARC health

## GAS Push Behavior

`.clasp.json` uses:

- `rootDir: "src"`
- `jsonExtensions: [".json"]`

Apps Script cannot directly read arbitrary project JSON files at runtime, so this project generates `KbData.js` from `kb.json` before push.

## Main Runtime Areas

- `Code.js`: shared utilities, menu, run entry point, secret setup guide, execution lock
- `Processor.js`: main inbox processing flow
- `BounceHandler.js`: bounce detection, parsing, API reporting
- `DmarcProcessor.js`: DMARC report ingestion and health updates
- `Cache.js`: idempotency and cache inspection tools
- `Triggers.js`: trigger install and status helpers

## Current Functional Status

Implemented:

- fetch and cache
- bounce handling
- DMARC ingestion
- locking and trigger safety

Planned:

- KB-driven non-bounce actions in the main processor
- OpenAI classification and drafting
- Mythoria ticket upsert for normal messages
