# Runbook

## Day 1 Setup

1. Run `npm install`
2. Run `npm run login`
3. Run `npm run push`
4. Run `npm run open`
5. In the bound Sheet, run:
   - `Initialize Sheet Tabs`
   - `Initialize Gmail Labels`
6. In Apps Script Project Settings, add Script Properties:
   - `openai_api_key`
   - `mythoria_api_base`
   - `mythoria_api_token`
7. In the Sheet, run `Tests -> Validate Setup`
8. Install a trigger from `Triggers -> Install Recommended Trigger`

## Daily Operations

Check:

- `Runs_Log` for execution status
- `Bounces` for bounce reporting health
- `DMARC_Health` for deliverability trends
- `Errors` for failures that need intervention

Useful menu items:

- `Run Email Engine (Manual)`
- `Clear Cache and Run`
- `Cache -> View Cache Stats`
- `Debug -> Why Are Emails Skipped?`
- `Triggers -> View Trigger Status`

## Updating Rules

1. Edit [src/kb.json](../src/kb.json)
2. Run `npm run push`
3. Confirm `View KB Summary` still works

## Updating Config

1. Edit [src/Config.js](../src/Config.js)
2. Run `npm run push`
3. If behavior changed materially, run `Tests -> Validate Setup`

## Interpreting Run Status

- `completed`: normal run
- `skipped`: disabled or outside run window
- `locked`: another execution already held the script lock
- `error`: unhandled failure in the main processor

## Recovery Steps

### Cache is blocking expected reprocessing

- Use `Cache -> Clear Cache (Force Reprocess)`

### Setup validation fails

- Recreate missing tabs or labels
- fix missing Script Properties
- re-run `npm run push` if the KB changed

### Trigger confusion after changes

- Open `Triggers -> View Trigger Status`
- reinstall the recommended trigger if needed
