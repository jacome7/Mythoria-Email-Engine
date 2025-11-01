# Mythoria Email Engine (GAS) — README

> **Goal**
> Ship a lean Google Apps Script (GAS) engine that: (1) triages unread inbox messages, (2) detects and marks bounces, (3) creates Tickets in `mythoria_admin` with concise summaries, and (4) prepares a Gmail draft reply.
> **Keep it simple:** Knowledge Base in **JSON**, idempotency via **CacheService**, OpenAI **Responses API** with **structured outputs**, and **GPT-5-mini** for low-cost classification.

---

## 1) What this engine does

* Polls the `hello@mythoria.pt` inbox on a **time-driven trigger** (every N minutes).
* Runs a **rules-first** triage using a **JSON Knowledge Base** (KB) file.
* If rules are inconclusive, calls **OpenAI Responses** in **structured-output** mode:

  * **GPT-5-mini** for fast, cheap **classification** (category + priority).
  * Escalate to a larger model **only if** a good **summary + reply** is needed.
* Detects **Delivery Status Notifications** (hard/soft bounces), updates Sheets, and calls the **Mythoria Bounce API**.
* Creates/updates a **Ticket** in `mythoria_admin` (idempotent), and saves a **Gmail draft** with a suggested reply.
* Persists telemetry in a single **Google Sheet** (the Apps Script is bound to this Sheet).

---

## 2) System Overview

```mermaid
flowchart LR
  T[Time-driven Trigger] --> IN[Fetch unread Gmail threads]
  IN --> KB[JSON KB Rules]
  KB -->|match| ACT[Action: ticket/skip/bounce/priority]
  KB -->|no match| LLM[OpenAI Responses (structured)]
  LLM --> ACT
  ACT -->|bounce| B[Bounce Handler]
  ACT -->|ticket| TK[mythoria_admin Ticket API]
  ACT -->|reply| DR[Gmail Draft Reply]
  B --> SH[Sheets Logs]
  TK --> SH
  DR --> SH
  IN --> SH
```

**Core components**

* **Google Apps Script** (bound to the Sheet): all logic runs here.
* **Google Sheet**: tabs for Config + Logs (Runs, Messages, Bounces, Tickets, Errors).
* **KB JSON**: one file (checked in or hosted in Drive) that defines pattern-based rules.
* **OpenAI**: Responses API with **structured outputs** (JSON).
* **`mythoria_admin`**: REST endpoints for Ticket Create/Upsert and Bounce.
* **CacheService**: idempotency guard for processed messages/threads.

---

## 3) Data & Storage

### 3.1 Google Sheet (one document)

* **Config**: key → value (enabled, batch_size, run_window, tz, model names, API base URLs, tokens, “dry_run” flag).
* **Runs_Log**: execution metrics per run.
* **Messages_Log**: one row per processed message (metadata, classification, actions taken).
* **Bounces**: DSN details (recipient, status code 4.x.x/5.x.x, reason).
* **Tickets**: ticket id per Gmail thread (idempotency record).
* **Errors**: timestamp, context, message.

> The **Knowledge Base is not in Sheets.** It lives in **`kb.json`** (see below).

### 3.2 Knowledge Base (JSON)

A single JSON file (e.g., `kb.json`) stored either:

* **Inside the Script project** as a file (simplest for v1), or
* In **Drive** (read at runtime; editable without redeploy).

**Rule structure (suggested):**

```json
{
  "version": "1.0",
  "denylist": [
    { "scope": "from_domain", "pattern": "noreply.example.com", "action": "skip", "notes": "system noise" }
  ],
  "rules": [
    {
      "match": [
        { "scope": "subject", "pattern": "undeliverable|Delivery Status Notification", "flags": "i" },
        { "scope": "from_local", "pattern": "mailer-daemon", "flags": "i" }
      ],
      "action": { "type": "bounce" },
      "notes": "Likely DSN"
    },
    {
      "match": [
        { "scope": "body", "pattern": "billing|invoice|refund", "flags": "i" }
      ],
      "action": { "type": "ticket", "priority": "P2", "category": "billing", "reply_hint": "billing_faq" }
    }
  ],
  "allowlist": [
    { "scope": "from_domain", "pattern": "trustedpartner.com", "action": "ticket", "notes": "Always ticket" }
  ]
}
```

**Scopes**: `from`, `from_domain`, `from_local`, `subject`, `body`, `label`, `has_attachment`, etc.
**Actions**: `skip`, `bounce`, `ticket` (optional `priority`, `category`, `reply_hint`), `priorityOnly`.

---

## 4) Idempotency (CacheService)

* Use **CacheService** (`ScriptCache`) to temporarily **remember processed items** and prevent double work within a short horizon.
* Cache keys: `processed:threadId` and `processed:messageId`.
* TTL: **max allowed** (GAS limit), refreshed on each run for active threads.
* Also keep durable idempotency in **Sheets** (`Tickets` tab) using `threadId` → `ticketId`.

  > Cache = “don’t reprocess now”; Sheet = “don’t duplicate forever”.

---

## 5) OpenAI — Structured Outputs & Cost Control

### 5.1 Model strategy

* **Default**: **GPT-5-mini** → cheap **classification**: (`category`, `priority`, `needs_ticket`, `reply_hint`, `is_bounce?`).
* **Escalate**: only when we need a **customer-facing draft** or a better **summary**, call a larger model (configurable).

  * You can gate escalation by **priority** (e.g., P0–P2 only) or KB flag (`requires_summary`).

### 5.2 Structured outputs (must-have)

All LLM calls return **strict JSON** (no prose) that conforms to a small **schema**. Example **classification schema**:

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "enum": ["support","billing","sales","legal","abuse","other"] },
    "priority": { "type": "string", "enum": ["P0","P1","P2","P3"] },
    "needs_ticket": { "type": "boolean" },
    "is_bounce": { "type": "boolean" },
    "reply_hint": { "type": "string" }
  },
  "required": ["category","priority","needs_ticket","is_bounce"]
}
```

**Drafting schema** (large model; only when needed):

```json
{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "reply_html": { "type": "string" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["summary","reply_html"]
}
```

> The engine **rejects** any LLM response that isn’t valid JSON per schema and logs to **Errors** (no draft created).

---

## 6) Processing Rules (Decision Order)

1. **Cache check** → if thread/message is in cache, **skip**.
2. **Bounce first** → DSN pattern or delivery-status part → log to **Bounces**, call **Bounce API**, label `Mythoria/Bounce`.
3. **KB rules** → first match wins:

   * `skip` → label `Mythoria/No-Action`, mark read.
   * `ticket` / `priorityOnly` → set action/priority/category.
4. **LLM classification (GPT-5-mini)** → decide `category`, `priority`, `needs_ticket` (and `is_bounce` as safety net).
5. **Ticketing** → if ticket-worthy:

   * **Upsert** in `mythoria_admin` using `threadId` as idempotency key.
   * On success: label `Mythoria/Ticketed`; store `ticketId`.
6. **Draft reply** → only if required/priority high:

   * Call large model for **summary + reply_html** (structured).
   * Create **Gmail Draft** reply in the same thread; log `draftId`.
7. **Cache update** → store `processed:threadId`/`messageId` for TTL; write **Messages_Log** and **Runs_Log**.

---

## 7) Configuration (Sheet → Config tab)

* `enabled=true|false`
* `dry_run=true|false`
* `batch_size=20`
* `run_window=08:00–20:00`
* `tz=Europe/Lisbon`
* `openai_model_classify=gpt-5-mini`
* `openai_model_draft=gpt-5` (or similar)
* `openai_base`, `openai_api_key`
* `mythoria_api_base`, `mythoria_api_token`
* `labels.ticketed`, `labels.bounce`, `labels.no_action`, `labels.needs_review`

> **KB location** is fixed in code via a simple constant (either project file name or Drive file ID).

---

## 8) Gmail Labels & Filters

* Create labels: `Mythoria/Ticketed`, `Mythoria/Bounce`, `Mythoria/No-Action`, `Mythoria/Needs-Review`.
* Optional filter to pre-label obvious DSNs into `Mythoria/Bounce` (reduces scan breadth).

---

## 9) Error Handling & Observability

* **Hard failure** (OpenAI 5xx/429, Admin API down): backoff once; on second failure, log to **Errors** and continue to next message.
* **Schema violation**: mark `Needs-Review`, log; do **not** create drafts.
* **Runs_Log** snapshots: processed, ticketed, bounced, skipped, drafted, warnings, errors.
* Optional: email admins when **N** consecutive runs have errors.

---

## 10) Security & Privacy

* API tokens and keys in **Script Properties**, not in Sheets.
* Do **not** write full email bodies to the Sheet; store metadata + short hashes/snippets.
* For LLM calls, send **minimal context** (redact secrets/PII that aren’t needed).

---

## 11) Implementation Plan (Phases)

> Each phase is small and shippable. Stop after any phase and you still have value.

### Phase 1 — Bootstrap (Sheet + GAS + KB)

* Create Sheet tabs (`Config`, `Runs_Log`, `Messages_Log`, `Bounces`, `Tickets`, `Errors`).
* Add labels in Gmail.
* Add **`kb.json`** to Script project (or Drive).
* Bind Apps Script; set Script Properties (API endpoints/keys).

**Exit criteria:** Script can read Config, load KB JSON, and write to logs.

---

### Phase 2 — Fetch & Cache (Skeleton Run)

* Time-driven trigger to fetch **unread** threads in window.
* **CacheService** check & set (`processed:threadId/messageId`).
* Minimal logging to `Runs_Log` and `Messages_Log`.

**Exit criteria:** Messages flow through fetch → cache guard → log without reprocessing.

---

### Phase 3 — Bounce Handling

* DSN detection (subjects/senders + delivery-status part).
* Classify **hard (5.x.x)** vs **soft (4.x.x)**; log to **Bounces**.
* Call **Bounce API**; label `Mythoria/Bounce`; mark read.

**Exit criteria:** Known DSNs are correctly flagged, logged, labeled, and posted.

---

### Phase 4 — KB Rules Triage

* Evaluate **JSON KB** in order: `denylist → rules → allowlist`.
* Actions: `skip`, `ticket` (+ priority/category), `priorityOnly`.
* Update `Messages_Log` with the rule hit.

**Exit criteria:** Clear rule matches produce expected actions without LLM.

---

### Phase 5 — LLM Classification (Cheap Path)

* **GPT-5-mini** structured classification (category, priority, needs_ticket, is_bounce, reply_hint).
* Only invoked when KB is inconclusive.

**Exit criteria:** Valid JSON outputs; decisions logged; schema violations handled.

---

### Phase 6 — Ticket Creation

* Upsert ticket in `mythoria_admin` (idempotent by `threadId`).
* On success: label `Mythoria/Ticketed`, store `ticketId`.

**Exit criteria:** No duplicate tickets for the same thread; updates work.

---

### Phase 7 — Draft Reply (Escalate Only When Needed)

* For qualifying cases (e.g., P0–P2), call large model for **summary + reply_html** (structured).
* Create **Gmail Draft** reply in-thread; log `draftId`.

**Exit criteria:** Drafts appear in Gmail; clean HTML; valid JSON under schema.

---

### Phase 8 — Controls, Quotas & QA

* Honor `enabled`, `dry_run`, `batch_size`, `run_window`, `tz`.
* Throttle batch if run time/quotas near limits.
* Test with fixtures (DSN, billing, support, noise); tune KB rules.
* Final runbook: how to pause, where to edit KB JSON, where to check logs.

**Exit criteria:** Stable runs with clear logs; stakeholders sign off.

---

## 12) Acceptance Criteria (End-to-End)

* Engine polls on schedule; **no duplicate processing** thanks to **CacheService** + Sheet.
* Bounces are detected, classified, logged, labeled, and posted to Mythoria.
* Messages are triaged **rules-first**; **GPT-5-mini** only when needed.
* Tickets are created/updated once per thread; IDs stored.
* Draft replies are created only for qualifying messages; drafts are review-ready.
* All actions are recorded in the Sheet; errors are visible and understandable.

---

## 13) Maintenance Notes

* To update behavior, **edit `kb.json`** (no Sheet changes needed).
* To tune costs, adjust model names in **Config**: keep **GPT-5-mini** for classification; restrict drafting escalations.
* Monitor Sheet growth; archive logs to a second Sheet if necessary.