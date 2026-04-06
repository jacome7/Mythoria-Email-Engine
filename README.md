# Mythoria Email Engine

Google Apps Script project for Mythoria inbox automation.

Current implemented features:
- Gmail polling with time-window and batch controls
- CacheService-based idempotency for inbox and DMARC processing
- Bounce detection, bounce logging, Gmail labeling, and Mythoria bounce API reporting
- DMARC aggregate report ingestion into `DMARC_Health`
- Bound-sheet logging for runs, messages, bounces, tickets, errors, and DMARC health
- Script-level execution locking to prevent overlapping trigger runs

Not implemented yet:
- KB-driven non-bounce triage in the main processor
- OpenAI classification and draft generation
- Mythoria ticket creation for regular messages

## Sources of Truth

- Non-secret configuration: [src/Config.js](src/Config.js)
- Knowledge Base authoring file: [src/kb.json](src/kb.json)
- Generated GAS KB payload: [src/KbData.js](src/KbData.js)
- Secrets: Apps Script Project Settings -> Script Properties

Do not edit secrets in source code.

## Local Workflow

1. Install dependencies:
   `npm install`
2. Authenticate `clasp`:
   `npm run login`
3. Sync the KB payload and push:
   `npm run push`
4. Open the Apps Script project:
   `npm run open`

`npm run push` is the supported push command because it regenerates `src/KbData.js` from `src/kb.json` before calling `clasp push`.

## Bound Sheet Setup

In the bound Google Sheet menu:

1. `Mythoria Email Engine -> Initialize Sheet Tabs`
2. `Mythoria Email Engine -> Initialize Gmail Labels`
3. Add Script Properties in Apps Script Project Settings:
   - `openai_api_key`
   - `mythoria_api_base`
   - `mythoria_api_token`
4. Run `Mythoria Email Engine -> Tests -> Validate Setup`
5. Optionally install the recommended trigger from `Mythoria Email Engine -> Triggers`

## Documentation

- [docs/RUNBOOK.md](docs/RUNBOOK.md): operator workflow and day-to-day use
- [docs/QUICKSTART.md](docs/QUICKSTART.md): shortest setup path
- [docs/SETUP.md](docs/SETUP.md): detailed setup instructions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): current runtime design
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md): repo structure and file ownership
- [docs/SOURCE_CODE.md](docs/SOURCE_CODE.md): module reference
- [docs/CHECKLIST.md](docs/CHECKLIST.md): deployment and maintenance checklist

Historical phase documents under `docs/PHASE*` remain as snapshots, not as the current source of truth.
