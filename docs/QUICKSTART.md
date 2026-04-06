# Quick Start

## Local

1. Install dependencies:
   `npm install`
2. Authenticate `clasp`:
   `npm run login`
3. Push the project:
   `npm run push`
4. Open the Apps Script project:
   `npm run open`

## Apps Script and Sheet

1. Open the bound Google Sheet and refresh it.
2. Run `Mythoria Email Engine -> Initialize Sheet Tabs`.
3. Run `Mythoria Email Engine -> Initialize Gmail Labels`.
4. In Apps Script, open `Project Settings -> Script Properties` and add:
   - `openai_api_key`
   - `mythoria_api_base`
   - `mythoria_api_token`
5. Run `Mythoria Email Engine -> Tests -> Validate Setup`.
6. If validation passes, install a trigger from `Mythoria Email Engine -> Triggers -> Install Recommended Trigger`.

## Important

- Non-secret settings live in [src/Config.js](../src/Config.js).
- Edit the Knowledge Base in [src/kb.json](../src/kb.json), then run `npm run push`.
- Do not store live secrets in source code.
