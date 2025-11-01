# agents.md — Mythoria Email Engine (GAS)

> **Purpose**
> You are an AI coding agent (e.g., OpenAI Codex 5, Claude Sonnet 4.5) implementing a lean Google Apps Script project that triages unread Gmail, detects bounces, opens Tickets in `mythoria_admin`, and creates Gmail Draft replies. Use a **JSON Knowledge Base**, **CacheService** for idempotency, the OpenAI **Responses API** with **structured outputs**, and **GPT-5-mini** for low-cost classification. Keep it simple.

---

## 1) Environment & Runtime

* **Runtime:** Google Apps Script (GAS), **bound to a single Google Sheet** that stores Config & Logs. Use Apps Script services: Gmail, Sheets, UrlFetch, Cache.
* **Scheduler:** time-driven (installable) triggers run every N minutes; timing is approximate by design. ([Google for Developers][1])
* **Gmail access:** use `GmailApp` to read/label threads and create **drafts** (HTML supported). ([Google for Developers][1])
* **External calls:** `UrlFetchApp` for OpenAI and `mythoria_admin` REST endpoints.
* **Idempotency:** `CacheService` for short-term “already processed” guards; Sheets for durable dedupe.

---

## 2) Knowledge Base (KB)

* **File:** `kb.json` in the Apps Script project (or Drive).
* **Philosophy:** rules-first; LLM only as fallback.
* **Order:** `denylist → rules → allowlist → LLM`.
* **Matcher fields:** `scope` (`from`, `from_domain`, `subject`, `body`, `label`, `has_attachment`…), `pattern` (regex), `flags`.
* **Actions:** `skip`, `bounce`, `priorityOnly`, `ticket` (`priority`, `category`, optional `reply_hint`).

---

## 3) LLM Usage (Structured Outputs)

* **Classifier (cheap path):** **GPT-5-mini**; return strict JSON:

  ```json
  {
    "category": "support|billing|sales|legal|abuse|other",
    "priority": "P0|P1|P2|P3",
    "needs_ticket": true,
    "is_bounce": false,
    "reply_hint": "string"
  }
  ```
* **Draft generator (escalate only when needed):** larger model returns:

  ```json
  { "summary": "string", "reply_html": "string", "confidence": 0.0 }
  ```
* **Fail closed:** if JSON isn’t valid per schema, don’t draft; log to Errors.

---

## 4) Processing Pipeline (high level)

1. **Trigger:** honor `enabled`, `run_window`, and `batch_size` from Config. ([Google for Developers][1])
2. **Fetch:** unread threads (optionally filtered by label); gather headers/body.
3. **Idempotency:** skip if `processed:threadId|messageId` present in **CacheService**; set cache on success.
4. **Bounce first:** detect DSN; classify **hard (5.x.x)** vs **soft (4.x.x)**; label & log; call Mythoria **Bounce API**.
5. **KB rules:** first match wins → action (skip / priorityOnly / ticket).
6. **LLM classify (GPT-5-mini):** only if KB is inconclusive.
7. **Ticket:** upsert in `mythoria_admin` (idempotent by `threadId`); label thread.
8. **Draft reply:** for qualifying tickets (e.g., P0–P2), generate **summary + reply_html** and create a **Gmail Draft** in-thread.
9. **Logs:** append to `Messages_Log` and `Runs_Log`.

---

## 5) Data: Google Sheet Tabs

* **Config:** `enabled, dry_run, batch_size, run_window, tz, openai_model_classify=gpt-5-mini, openai_model_draft, openai_base, openai_api_key, mythoria_api_base, mythoria_api_token, labels.*`
* **Runs_Log:** per-run metrics (processed, ticketed, bounced, skipped, drafted, warnings, errors).
* **Messages_Log:** one row per message (ids, action, priority, category, ticketId, draftId, labels).
* **Bounces:** recipient, status code (4.x.x/5.x.x), reason, ids, API result.
* **Tickets:** `ticketId` keyed by `threadId`.
* **Errors:** timestamp, where (fetch/parse/api/openai), what, retry.

---

## 6) **clasp** (Apps Script CLI) — for local dev & CI

> We use **clasp** to develop locally, version/deploy, and open the online editor. It’s the official CLI recommended by Google for Apps Script local workflows. ([Google for Developers][1])

### 6.1 Installation & basics

* Requires **Node.js**; install globally: `npm install -g @google/clasp`. ([Google for Developers][1])
* Common commands:

  * `clasp login` — authenticate;
  * `clasp push` / `clasp pull` — upload/download project files;
  * `clasp versions` — list versions; `clasp version` — create new version;
  * `clasp deploy` / `clasp redeploy` — manage deployments;
  * `clasp open` — open the project in the Apps Script editor. ([Google for Developers][1])

### 6.2 `.clasp.json` (already present ✅)

* This repo **already contains `.clasp.json`**. Do **not** delete/overwrite it.
* Purpose: **stores the Script ID** (and, if configured, `rootDir`) so `clasp push/pull` know which Apps Script project to target. ([Google for Developers][1])
* When creating a project via `clasp create`, the CLI generates **`.clasp.json`** and the **`appsscript.json` manifest**; since ours exists, you don’t need `clasp create`/`clone` — just `clasp login` then `clasp push/pull`. ([Google for Developers][1])
* About `rootDir`: some workflows place source under a subfolder (e.g., `./src`) and reference it in `.clasp.json`. Be aware of this behavior if you reorganize folders. ([GitHub][2])

### 6.3 Manifest (`appsscript.json`)

* The Apps Script **manifest** defines project behavior (add-ons, web apps, scopes, etc.). Edit with care — wrong changes can break execution or deployment. ([Google for Developers][3])
* Google’s manifest reference documents the structure and supported fields. ([Google for Developers][4])

### 6.4 TypeScript (optional)

* Google’s guide shows how `clasp push --watch` can compile TS and upload on changes if you choose a TS setup; optional for this project. ([Google for Developers][5])

### 6.5 Why clasp here?

* Local dev with Git, structured code, and deployment/version control from the CLI (official tooling & docs). ([Google for Developers][1])

---

## 7) Guardrails & Quality

* **Privacy:** log metadata/snippets, not full bodies.
* **Schema-first:** reject non-JSON or invalid JSON from the LLM.
* **Cost:** default to **GPT-5-mini** for classification; escalate only for summaries/replies.
* **Reliability:** CacheService + Sheets for idempotency.
* **Deployment discipline:** if you modify the **manifest**, remember that it controls scopes/deployments; verify before pushing. ([Google for Developers][3])

---

## 8) Done Criteria

* Trigger runs on schedule; respects `batch_size/run_window`; logs in `Runs_Log`. ([Google for Developers][1])
* Bounces are detected, labeled, logged, and posted to Mythoria.
* KB rules handle most messages; **GPT-5-mini** only when needed; structured JSON validated.
* Tickets are created/updated once per Gmail thread; drafts created for eligible cases and visible in Gmail.
* `clasp` can **push/pull**, **open**, **version/deploy** the project using the existing **`.clasp.json`**. ([Google for Developers][1])

---

## 9) Quick Links

* **clasp (official doc):** install, login, push/pull, versions/deploy, open. ([Google for Developers][1])
* **clasp (GitHub):** features & releases. ([GitHub][6])
* **Manifest (overview & structure):** what it is, fields, and cautions. ([Google for Developers][3])
* **TypeScript with clasp:** optional watch/compile/push loop. ([Google for Developers][5])

> With this, an agent can safely build, run, and maintain the Mythoria Email Engine via GAS + Sheets, while developing locally through `clasp` using the **existing `.clasp.json`**.

[1]: https://developers.google.com/apps-script/guides/clasp "Use the command line interface with clasp  |  Apps Script  |  Google for Developers"
[2]: https://github.com/google/clasp/issues/923?utm_source=chatgpt.com "clasp generates .clasp.json under the 'rootDir' folder #923"
[3]: https://developers.google.com/apps-script/concepts/manifests?utm_source=chatgpt.com "Manifests | Apps Script"
[4]: https://developers.google.com/apps-script/manifest?utm_source=chatgpt.com "Manifest structure | Apps Script"
[5]: https://developers.google.com/apps-script/guides/typescript?utm_source=chatgpt.com "Develop Apps Script using TypeScript"
[6]: https://github.com/google/clasp?utm_source=chatgpt.com "google/clasp: 🔗 Command Line Apps Script Projects"
