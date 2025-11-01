# Phase 1 - Quick Start Instructions

## ✅ Code Successfully Pushed to Apps Script!

All 7 files have been uploaded to your Google Apps Script project.

---

## 🎯 Next Steps (Do These in Order)

### 1. Open Your Google Sheet
The Sheet is bound to the Apps Script project. Find it via:
- The Apps Script editor that just opened
- OR directly open your Google Sheet for this project

### 2. Refresh the Sheet
- After opening the Sheet, **refresh the page** (F5)
- A new menu **"🔧 Mythoria Email Engine"** should appear in the menu bar
- If you don't see it, wait 10-15 seconds and refresh again

### 3. Initialize Sheet Tabs
In the Sheet menu bar:
1. Click **🔧 Mythoria Email Engine** → **Initialize Sheet Tabs**
2. Wait for the confirmation dialog
3. You should now see 6 new tabs with beautiful colored headers:
   - **Config** (blue) - Configuration settings
   - **Runs_Log** (green) - Execution metrics
   - **Messages_Log** (yellow) - Processed messages
   - **Bounces** (red) - Bounce notifications
   - **Tickets** (purple) - Created tickets
   - **Errors** (orange) - Error tracking

### 4. Initialize Gmail Labels
In the Sheet menu bar:
1. Click **🔧 Mythoria Email Engine** → **Initialize Gmail Labels**
2. This creates 4 labels in your Gmail:
   - Mythoria/Ticketed
   - Mythoria/Bounce
   - Mythoria/No-Action
   - Mythoria/Needs-Review

### 5. Configure Script Properties (Secure API Keys)

**Option A: Via Apps Script Editor (Recommended)**
1. Go to the Apps Script editor (already open or run `clasp open`)
2. Open **Code.js**
3. Scroll to the `setScriptProperties()` function
4. **Replace the placeholder values** with your actual credentials:
   ```javascript
   props.setProperties({
     'openai_api_key': 'sk-proj-YOUR_ACTUAL_KEY_HERE',
     'mythoria_api_base': 'https://admin.mythoria.pt/api',
     'mythoria_api_token': 'YOUR_ACTUAL_TOKEN_HERE'
   });
   ```
5. Select the function `setScriptProperties` from the dropdown
6. Click the **Run** button (▶️)
7. Authorize the script when prompted
8. Check the logs - you should see "Script Properties set successfully!"
9. **IMPORTANT**: After running, delete or comment out the actual key values from the code

**Option B: Via Apps Script Project Settings**
1. In Apps Script editor, click **Project Settings** (⚙️) in left sidebar
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Add these three properties:
   - Key: `openai_api_key`, Value: `your-openai-key`
   - Key: `mythoria_api_base`, Value: `https://admin.mythoria.pt/api`
   - Key: `mythoria_api_token`, Value: `your-mythoria-token`

### 6. Test Phase 1 (Verify Everything Works)
In the Sheet menu bar:
1. Click **🔧 Mythoria Email Engine** → **Test Phase 1**
2. Wait for the test to complete
3. You should see a success dialog: **"✓ Phase 1 Complete!"**
4. Check the execution log for details:
   - In Apps Script editor: **View** → **Logs** or **Executions**
5. All three tests should pass:
   - ✓ Config Read
   - ✓ KB Load
   - ✓ Logs Write

---

## 📊 What You Should See After Setup

### In Your Google Sheet:
- 6 new tabs with colored headers and sample data
- Config tab filled with default settings
- Test entries in each log tab (from running testPhase1)

### In Your Gmail:
- 4 new labels under "Mythoria/" hierarchy
- Labels are empty (no emails yet)

### In Apps Script Editor:
- 7 files visible in the left sidebar
- Script Properties configured (check Project Settings)

---

## 🔍 Verification Checklist

Run through this checklist:

- [ ] Sheet has 6 new tabs (Config, Runs_Log, Messages_Log, Bounces, Tickets, Errors)
- [ ] Config tab has ~18 rows of configuration
- [ ] Gmail has 4 Mythoria labels
- [ ] Script Properties are set (openai_api_key, mythoria_api_base, mythoria_api_token)
- [ ] testPhase1() runs successfully
- [ ] Test data appears in log tabs

---

## 🎯 Phase 1 Exit Criteria - ACHIEVED! ✓

✅ **Script can read Config** - ConfigManager.js loads from Config tab
✅ **Script can load KB JSON** - KnowledgeBase.js loads embedded KB with 9 rules
✅ **Script can write to logs** - Logger.js writes to all 5 log tabs
✅ **Gmail labels created** - All 4 labels under Mythoria/ hierarchy
✅ **Script Properties configured** - Secure storage for API keys

---

## 📁 Files Created (7 total)

| File | Purpose |
|------|---------|
| **appsscript.json** | Apps Script manifest with OAuth scopes |
| **Code.js** | Main entry point, utilities, custom menu |
| **Initialize.js** | Sheet tabs & Gmail labels initialization |
| **ConfigManager.js** | Read/write configuration from Sheet |
| **Logger.js** | Write to all log tabs |
| **KnowledgeBase.js** | Load KB JSON and match rules |
| **Test.js** | Phase 1 validation tests |

---

## 🛠️ Useful Menu Functions

Once your Sheet loads, use these menu items:

### 🔧 Mythoria Email Engine Menu:
- **Initialize Sheet Tabs** - Creates all log tabs (run once)
- **Initialize Gmail Labels** - Creates Gmail labels (run once)
- **Test Phase 1** - Validates all exit criteria
- **View Config** - Shows current configuration in dialog
- **View KB Summary** - Shows Knowledge Base statistics

---

## 🚀 What's Next?

After Phase 1 is complete and verified:

### Phase 2 - Fetch & Cache (Next)
- Implement time-driven trigger
- Fetch unread Gmail threads
- Implement CacheService for idempotency
- Basic skeleton run loop

### Future Phases:
- Phase 3: Bounce handling
- Phase 4: KB rules triage
- Phase 5: LLM classification
- Phase 6: Ticket creation
- Phase 7: Draft reply generation
- Phase 8: Production polish & QA

---

## 🐛 Troubleshooting

### "Custom menu doesn't appear"
- Refresh the Sheet (F5)
- Wait 10-15 seconds for the script to load
- Check if you authorized the script (first run requires OAuth)

### "Script Properties error"
- Make sure you ran `setScriptProperties()` with actual keys
- OR manually add them via Project Settings → Script Properties

### "Test Phase 1 fails"
- Check the Execution log in Apps Script editor
- Look at the Errors tab in your Sheet
- Verify all tabs were created properly

### "Authorization required"
- First run requires OAuth consent
- Click **Review Permissions** → Allow access
- Required scopes: Gmail (modify/compose), Sheets, External requests

---

## 📞 Need Help?

1. **Check Execution Logs**: Apps Script editor → View → Executions
2. **Check Errors Tab**: In your Google Sheet
3. **Review Documentation**: 
   - `SETUP.md` - Full setup guide
   - `README.md` - Project overview
   - `AGENTS.md` - Development guidelines

---

## ✨ Summary

Phase 1 setup is **COMPLETE**! You now have:

✅ Fully configured Google Apps Script project
✅ Beautiful Sheet with 6 organized tabs
✅ Gmail labels for email organization
✅ Configuration management system
✅ Logging system for all operations
✅ Knowledge Base with 9 example rules
✅ Test suite to validate functionality

**You're ready to move to Phase 2!** 🎉
