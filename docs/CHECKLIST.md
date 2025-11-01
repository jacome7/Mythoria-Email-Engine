# ✅ Phase 1 Setup Checklist

## Before You Start
- [x] Clasp installed and authenticated
- [x] Code pushed to Apps Script (7 files)
- [x] Apps Script project opened in browser

---

## Step 1: Open Your Google Sheet
**Time: 1 minute**

- [ ] Navigate to your Google Sheet (bound to the Apps Script)
- [ ] Refresh the page (F5 or Ctrl+R)
- [ ] Wait 10-15 seconds for the script to load
- [ ] Look for **"🔧 Mythoria Email Engine"** menu in the menu bar

**Troubleshooting:**
- If menu doesn't appear, check Apps Script editor for errors
- Try refreshing again after 30 seconds
- Check that script is bound to the correct Sheet

---

## Step 2: Initialize Sheet Tabs
**Time: 30 seconds**

- [ ] Click **🔧 Mythoria Email Engine** → **Initialize Sheet Tabs**
- [ ] Wait for the function to complete
- [ ] Check for success dialog
- [ ] Verify 6 new tabs appeared at the bottom:
  - [ ] **Config** (blue headers)
  - [ ] **Runs_Log** (green headers)
  - [ ] **Messages_Log** (yellow headers)
  - [ ] **Bounces** (red headers)
  - [ ] **Tickets** (purple headers)
  - [ ] **Errors** (orange headers)

**Verify Config Tab:**
- [ ] Has ~18 rows of configuration
- [ ] Key column has values like: enabled, batch_size, tz, etc.
- [ ] Value column has defaults like: true, 20, Europe/Lisbon, etc.

**Troubleshooting:**
- If tabs exist but are empty, delete them and run again
- Check Execution log in Apps Script for errors

---

## Step 3: Initialize Gmail Labels
**Time: 30 seconds**

- [ ] Click **🔧 Mythoria Email Engine** → **Initialize Gmail Labels**
- [ ] Wait for the function to complete
- [ ] Check the success dialog
- [ ] Note how many labels were created vs. already existed

**Verify in Gmail:**
- [ ] Open Gmail (hello@mythoria.pt)
- [ ] Check left sidebar for new labels:
  - [ ] **Mythoria/Ticketed**
  - [ ] **Mythoria/Bounce**
  - [ ] **Mythoria/No-Action**
  - [ ] **Mythoria/Needs-Review**

**Troubleshooting:**
- Labels may take a few seconds to appear in Gmail
- Refresh Gmail if needed
- Check Execution log for permission errors

---

## Step 4: Configure Script Properties (API Keys)
**Time: 2-3 minutes**

### Method 1: Via Code (Recommended)

**Step 4.1: Edit the Function**
- [ ] In Apps Script editor (already open), click **Code.js**
- [ ] Scroll to the `setScriptProperties()` function (around line 75)
- [ ] Replace the placeholder values:

```javascript
// BEFORE:
props.setProperties({
  'openai_api_key': 'YOUR_OPENAI_API_KEY_HERE',
  'mythoria_api_base': 'https://admin.mythoria.pt/api',
  'mythoria_api_token': 'YOUR_MYTHORIA_API_TOKEN_HERE'
});

// AFTER (with your actual values):
props.setProperties({
  'openai_api_key': 'sk-proj-abc123...',  // Your actual OpenAI key
  'mythoria_api_base': 'https://admin.mythoria.pt/api',
  'mythoria_api_token': 'your_actual_token_here'  // Your actual Mythoria token
});
```

**Step 4.2: Run the Function**
- [ ] In Apps Script editor, select **setScriptProperties** from function dropdown
- [ ] Click the **Run** button (▶️)
- [ ] If prompted, click **Review Permissions** → **Allow**
- [ ] Check the Execution log (View → Logs)
- [ ] Should see: "Script Properties set successfully!"

**Step 4.3: Secure the Code**
- [ ] After successful run, replace the actual keys with placeholders again
- [ ] OR comment out the actual values
- [ ] Save the file (Ctrl+S)

**Your keys are now stored securely and NOT in the code!**

### Method 2: Via Project Settings (Alternative)

**If Method 1 doesn't work:**
- [ ] In Apps Script editor, click **Project Settings** (⚙️) in left sidebar
- [ ] Scroll to **Script Properties** section
- [ ] Click **Add script property** button
- [ ] Add three properties:

| Property Name | Property Value |
|--------------|----------------|
| openai_api_key | sk-proj-your-key-here |
| mythoria_api_base | https://admin.mythoria.pt/api |
| mythoria_api_token | your-token-here |

- [ ] Click **Save script properties**

**Troubleshooting:**
- Make sure property names are EXACTLY as shown (case-sensitive)
- No extra spaces in property names or values
- Values should NOT be in quotes

---

## Step 5: Test Phase 1
**Time: 1 minute**

**Run the Test:**
- [ ] Back in Google Sheet, click **🔧 Mythoria Email Engine** → **Test Phase 1**
- [ ] Wait for test to complete (10-20 seconds)
- [ ] Check the dialog that appears

**Expected Result:**
```
✓ Phase 1 Complete!

All exit criteria have been met:
✓ Script can read Config
✓ Script can load KB JSON
✓ Script can write to logs

Check the logs (Execution log) for detailed test results.
```

**Verify Test Data:**
- [ ] Check **Runs_Log** tab - should have 1 test row
- [ ] Check **Messages_Log** tab - should have 1 test row
- [ ] Check **Bounces** tab - should have 1 test row
- [ ] Check **Tickets** tab - should have 1 test row
- [ ] Check **Errors** tab - should have 1 test row

**Check Detailed Results:**
- [ ] In Apps Script editor, click **Executions** in left sidebar
- [ ] Click the latest execution
- [ ] Expand the logs and verify all tests passed

**Troubleshooting:**
- If "Config failed to load": Re-run Initialize Sheet Tabs
- If "KB failed to load": Check KnowledgeBase.js file was pushed
- If "Logs failed to write": Check Sheet tab names match exactly
- If "Script Properties not set": Complete Step 4 above

---

## Step 6: Verify Everything
**Time: 2 minutes**

**Configuration:**
- [ ] Click **🔧 Mythoria Email Engine** → **View Config**
- [ ] Dialog shows all configuration values
- [ ] Values match what's in Config tab

**Knowledge Base:**
- [ ] Click **🔧 Mythoria Email Engine** → **View KB Summary**
- [ ] Dialog shows:
  ```
  Knowledge Base v1.0
  Denylist rules: 2
  Processing rules: 7
  Allowlist rules: 1
  Total rules: 10
  ```

**Script Properties:**
- [ ] In Apps Script editor → Project Settings
- [ ] Scroll to Script Properties
- [ ] Verify 3 properties are listed (values hidden)

**Gmail Labels:**
- [ ] Open Gmail
- [ ] All 4 Mythoria labels visible in sidebar
- [ ] Labels are empty (no emails yet)

---

## Step 7: Clean Up Test Data (Optional)
**Time: 30 seconds**

**Only if you want to remove test entries:**
- [ ] In Apps Script editor, open **Test.js**
- [ ] Find function `cleanupTestData()`
- [ ] Select it from dropdown and click Run
- [ ] Confirm "Yes" in the dialog
- [ ] Verify all log tabs are empty (headers only)

**Note:** You can skip this step. Test data won't affect Phase 2.

---

## Final Verification Checklist

### Google Sheet
- [ ] 6 tabs exist with colored headers
- [ ] Config tab has ~18 rows of settings
- [ ] All tabs have proper column headers
- [ ] Test data present in log tabs (or cleaned up)

### Gmail
- [ ] 4 labels exist under "Mythoria/" hierarchy
- [ ] Labels are properly nested
- [ ] Labels are empty (no emails)

### Apps Script
- [ ] 7 files visible in editor
- [ ] No errors in latest execution
- [ ] Script Properties configured (3 properties)
- [ ] OAuth scopes approved

### Menu & Functions
- [ ] Custom menu appears in Sheet
- [ ] All 5 menu items work
- [ ] testPhase1() passes all tests
- [ ] No errors in Execution log

---

## Success Criteria

✅ **You're done when ALL of these are true:**

1. ✓ Sheet has 6 tabs with colored headers
2. ✓ Gmail has 4 Mythoria labels
3. ✓ Script Properties are configured (3 keys)
4. ✓ testPhase1() shows "Phase 1 Complete!"
5. ✓ No errors in Execution log
6. ✓ Custom menu works in Sheet

---

## What You've Accomplished

🎉 **Congratulations!** You now have:

- ✅ Fully functional Google Apps Script project
- ✅ Beautiful Sheet interface with 6 organized tabs
- ✅ Gmail labels for email organization
- ✅ Configuration management system
- ✅ Comprehensive logging system
- ✅ Knowledge Base with 9 rules
- ✅ Secure API key storage
- ✅ Full test coverage

---

## Next Steps

**You're ready for Phase 2!**

Phase 2 will add:
- Time-driven triggers (scheduled execution)
- Email fetching from Gmail
- CacheService for idempotency
- Basic processing loop

Estimated time: 2-3 hours of development

---

## Need Help?

### Check These First:
1. **Execution Log** - Apps Script editor → Executions
2. **Errors Tab** - In your Google Sheet
3. **QUICKSTART.md** - Quick reference guide
4. **SETUP.md** - Detailed setup instructions

### Common Issues:

**Menu doesn't appear:**
- Refresh Sheet (F5)
- Wait 15-30 seconds
- Check Apps Script for errors

**Tests fail:**
- Re-run Initialize Sheet Tabs
- Re-run Initialize Gmail Labels
- Check Script Properties are set
- Review Execution log

**Permission errors:**
- Click "Review Permissions" when prompted
- Allow all requested scopes
- May need to enable "Less secure apps" in Google settings

---

## Completion Time Estimate

| Step | Time | Status |
|------|------|--------|
| Open Sheet | 1 min | [ ] |
| Initialize Tabs | 30 sec | [ ] |
| Initialize Labels | 30 sec | [ ] |
| Set Script Properties | 2-3 min | [ ] |
| Test Phase 1 | 1 min | [ ] |
| Verify Everything | 2 min | [ ] |
| Clean Up (optional) | 30 sec | [ ] |
| **TOTAL** | **~8 minutes** | |

---

Generated: November 1, 2025
Version: 1.0.0
Phase: 1 Setup Checklist
