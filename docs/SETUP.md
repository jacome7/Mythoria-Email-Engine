# Phase 1 Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Authenticate with Google
```powershell
clasp login
```

### 3. Push Code to Apps Script
```powershell
clasp push
```

### 4. Open Apps Script Editor
```powershell
clasp open
```

---

## 📋 Phase 1 Setup Checklist

### Step 1: Push Code to Google Apps Script
```powershell
# From project root
clasp push
```

This uploads all files from `src/` to your Apps Script project.

### Step 2: Open the Google Sheet
1. Open your Google Sheet bound to this script
2. You should see a new menu: **🔧 Mythoria Email Engine** (after refresh)

### Step 3: Initialize Sheet Tabs
1. In the Sheet, go to menu: **🔧 Mythoria Email Engine → Initialize Sheet Tabs**
2. This creates all required tabs with beautiful formatting:
   - Config (blue headers)
   - Runs_Log (green headers)
   - Messages_Log (yellow headers)
   - Bounces (red headers)
   - Tickets (purple headers)
   - Errors (orange headers)

### Step 4: Initialize Gmail Labels
1. Go to menu: **🔧 Mythoria Email Engine → Initialize Gmail Labels**
2. This creates the following labels in your Gmail:
   - Mythoria/Ticketed
   - Mythoria/Bounce
   - Mythoria/No-Action
   - Mythoria/Needs-Review

### Step 5: Configure Script Properties (Secure Storage)
1. In Apps Script editor, open **Code.js**
2. Find the function `setScriptProperties()`
3. Replace placeholder values with your actual credentials:
   ```javascript
   props.setProperties({
     'openai_api_key': 'sk-proj-...',  // Your OpenAI API key
     'mythoria_api_base': 'https://admin.mythoria.pt/api',  // Mythoria API URL
     'mythoria_api_token': 'your_token_here'  // Your Mythoria API token
   });
   ```
4. Run the function **once** from the editor (select function, click Run)
5. After running, you can delete or comment out the actual values (they're now stored securely)

### Step 6: Test Phase 1
1. Go to menu: **🔧 Mythoria Email Engine → Test Phase 1**
2. Check the execution log for test results
3. All three tests should pass:
   - ✓ Config Read
   - ✓ KB Load
   - ✓ Logs Write

---

## 📁 Project Structure

```
Mythoria-Email-Engine/
├── src/
│   ├── appsscript.json      # Apps Script manifest (OAuth scopes)
│   ├── Code.js              # Main entry point & utilities
│   ├── Initialize.js        # Sheet tabs & Gmail labels setup
│   ├── ConfigManager.js     # Configuration reader
│   ├── Logger.js            # Logging functions
│   ├── KnowledgeBase.js     # KB loader & rule matcher
│   ├── Test.js              # Phase 1 test script
│   └── kb.json              # Knowledge Base rules
├── package.json
├── .clasp.json              # Clasp configuration
├── SETUP.md                 # This file
└── README.md                # Project documentation
```

---

## 🔧 Configuration

### Config Tab (in Sheet)
All non-sensitive configuration is stored in the **Config** tab:

| Key | Default Value | Description |
|-----|---------------|-------------|
| enabled | true | Enable/disable the engine |
| dry_run | false | Test mode (no actual actions) |
| batch_size | 20 | Messages per run |
| run_window | 08:00-20:00 | Operating hours |
| tz | Europe/Lisbon | Timezone |
| openai_model_classify | gpt-4o-mini | Classification model (cheap) |
| openai_model_draft | gpt-4o | Draft generation model |
| openai_base | https://api.openai.com/v1 | OpenAI API base |
| labels_ticketed | Mythoria/Ticketed | Ticketed label |
| labels_bounce | Mythoria/Bounce | Bounce label |
| labels_no_action | Mythoria/No-Action | No action label |
| labels_needs_review | Mythoria/Needs-Review | Needs review label |

### Script Properties (Secure)
Sensitive data stored securely via Script Properties:
- `openai_api_key` - Your OpenAI API key
- `mythoria_api_base` - Mythoria API endpoint
- `mythoria_api_token` - Mythoria API token

---

## 📊 Knowledge Base (kb.json)

The KB is embedded in `KnowledgeBase.js` for Phase 1. It contains:

- **Denylist**: Patterns to skip (e.g., noreply addresses)
- **Rules**: Processing rules with actions (bounce detection, billing, support, etc.)
- **Allowlist**: Always-create-ticket patterns

Example rule:
```json
{
  "id": "urgent_support",
  "match": [
    {
      "scope": "subject",
      "pattern": "(urgent|emergency|critical|down|outage)",
      "flags": "i"
    }
  ],
  "action": {
    "type": "ticket",
    "priority": "P0",
    "category": "support",
    "reply_hint": "Escalate to on-call engineer"
  }
}
```

---

## ✅ Phase 1 Exit Criteria

Phase 1 is complete when:

- ✓ Script can read Config from Sheet
- ✓ Script can load KB JSON
- ✓ Script can write to all log tabs
- ✓ Gmail labels are created
- ✓ Script Properties are set

Run `testPhase1()` to verify!

---

## 🛠️ Useful Commands

```powershell
# Push code changes
clasp push

# Pull latest from Apps Script
clasp pull

# Open Apps Script editor
clasp open

# View clasp status
clasp status

# View clasp version
clasp -v
```

---

## 🎯 Custom Menu Functions

Once the sheet loads, you'll have these menu items:

- **Initialize Sheet Tabs** - Creates all log tabs with formatting
- **Initialize Gmail Labels** - Creates Gmail labels
- **Test Phase 1** - Validates exit criteria
- **View Config** - Shows current configuration
- **View KB Summary** - Shows KB rule counts

---

## 🐛 Troubleshooting

### "Config sheet not found"
Run: **Initialize Sheet Tabs** from the menu

### "Gmail labels not found"
Run: **Initialize Gmail Labels** from the menu

### "Script Properties not set"
1. Edit `Code.js` → `setScriptProperties()`
2. Add your actual API keys
3. Run the function once
4. Delete/comment out the keys from code

### "Test Phase 1 fails"
Check the Execution log (View → Logs in Apps Script editor) for details

---

## 📝 Notes

- **KB JSON**: Currently embedded in `KnowledgeBase.js`. In future phases, we can migrate to reading from Drive.
- **OAuth Scopes**: Defined in `appsscript.json`. You'll need to authorize on first run.
- **Time Zone**: Set in `Config` tab (`tz` key). Default is `Europe/Lisbon`.
- **Dry Run**: Set `dry_run=true` in Config to test without taking actions.

---

## 🎉 Next Steps

After Phase 1 is complete:
- **Phase 2**: Implement fetch & cache (skeleton run)
- **Phase 3**: Add bounce handling
- **Phase 4**: Implement KB rules triage
- **Phase 5**: Add LLM classification
- **Phase 6**: Implement ticket creation
- **Phase 7**: Add draft reply generation
- **Phase 8**: Polish, QA, and production deploy

---

## 📞 Support

For issues or questions:
1. Check the Execution log in Apps Script
2. Review the Errors tab in the Sheet
3. Check AGENTS.md for AI coding guidelines
4. Review README.md for full project documentation
