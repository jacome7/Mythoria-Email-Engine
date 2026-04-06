# Setup Guide

## Prerequisites

- Node.js installed
- `clasp` authentication for the Google account that owns the Apps Script project
- Access to the bound Google Sheet and Gmail mailbox

## Repository Workflow

This repo uses `.clasp.json` with `rootDir: "src"`.

Supported commands:

- `npm run login`
- `npm run push`
- `npm run pull`
- `npm run open`
- `npm run status`

Use `npm run push` instead of raw `clasp push`. It regenerates `src/KbData.js` from `src/kb.json` first.

## Configuration Model

There are two configuration layers:

1. Non-secret settings in [src/Config.js](../src/Config.js)
2. Secrets in Apps Script Project Settings -> Script Properties

Required Script Properties:

- `openai_api_key`
- `mythoria_api_base`
- `mythoria_api_token`

The Google Sheet is for logs and health data. It is not the source of truth for runtime config.

## First-Time Setup

### 1. Push the code

Run:

```powershell
npm install
npm run login
npm run push
```

### 2. Open the Apps Script project

Run:

```powershell
npm run open
```

Open the bound Google Sheet from the Apps Script editor if needed.

### 3. Initialize the sheet tabs

In the Google Sheet:

- `Mythoria Email Engine -> Initialize Sheet Tabs`

This creates:

- `Runs_Log`
- `Messages_Log`
- `Bounces`
- `Tickets`
- `Errors`
- `DMARC_Health`

### 4. Initialize Gmail labels

In the Google Sheet:

- `Mythoria Email Engine -> Initialize Gmail Labels`

This ensures:

- `Mythoria/Ticketed`
- `Mythoria/Bounce`
- `Mythoria/No-Action`
- `Mythoria/Needs-Review`
- `Mythoria/DMARC`

### 5. Add Script Properties

In the Apps Script editor:

1. Open `Project Settings`
2. Go to `Script Properties`
3. Add the required keys and values

Do not use source code to bootstrap secrets.

### 6. Validate setup

In the Google Sheet:

- `Mythoria Email Engine -> Tests -> Validate Setup`

Validation checks:

- `Config.js` loads
- the Knowledge Base loads from the generated GAS payload
- required sheet tabs exist
- required Gmail labels exist
- required Script Properties are present

### 7. Install a trigger

In the Google Sheet:

- `Mythoria Email Engine -> Triggers -> Install Recommended Trigger`

The project now uses a script-level execution lock, so overlapping trigger fires will skip safely instead of racing.

## Updating the Knowledge Base

1. Edit [src/kb.json](../src/kb.json)
2. Run `npm run push`

`npm run push` regenerates [src/KbData.js](../src/KbData.js), which is the runtime payload used by Apps Script.

## Updating Runtime Settings

Edit [src/Config.js](../src/Config.js) for:

- batch size
- run window
- model names
- cache TTL
- DMARC behavior
- lock timeout

Then run `npm run push`.

## Troubleshooting

### Validate Setup fails

- Re-run `Initialize Sheet Tabs`
- Re-run `Initialize Gmail Labels`
- Check missing keys in `Project Settings -> Script Properties`
- Confirm you used `npm run push` after editing `src/kb.json`

### No emails are processed

- Check `enabled` and `run_window` in [src/Config.js](../src/Config.js)
- Use `Debug -> Why Are Emails Skipped?`
- Check cache state from `Cache -> View Cache Stats`

### Trigger runs appear to be skipped

- Check `Runs_Log`
- A `locked` status means another execution already held the script lock
- Increase `lock_timeout_ms` only if overlap is expected and safe
