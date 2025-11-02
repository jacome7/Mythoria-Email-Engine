# Phase 3 Quick Start Guide

## 🎉 Phase 3 is Complete!

Your Mythoria Email Engine now includes **full bounce detection and handling**. Here's how to get started.

---

## ⚡ Quick Setup (5 minutes)

### 1. Open Your Google Sheet
The Sheet should refresh automatically and show the new menu options.

### 2. Run Phase 3 Test
**Menu:** `🔧 Mythoria Email Engine → Tests → Test Phase 3 (Bounce Handling)`

This validates:
- ✅ Bounce detection working
- ✅ Status code extraction
- ✅ Hard/soft classification
- ✅ Configuration valid

**Expected result:** All tests pass ✓ (API credentials check may warn if not set yet)

### 3. Set Mythoria API Credentials (Required for Production)
**Option A - Apps Script Editor:**
1. Click `Extensions → Apps Script` (or run `clasp open`)
2. Open `Code.js`
3. Find `setScriptProperties()` function
4. Replace placeholders:
   ```javascript
   'mythoria_api_base': 'https://admin.mythoria.pt/api',
   'mythoria_api_token': 'YOUR_ACTUAL_TOKEN_HERE'
   ```
5. Run the function once (click ▶️ button)
6. Delete/comment out the token from code

**Option B - Script Properties UI:**
1. Apps Script → Project Settings → Script Properties
2. Add property: `mythoria_api_token` → `<your_token>`
3. Property should already exist: `mythoria_api_base` → `https://admin.mythoria.pt/api`

### 4. Test with Real Emails (Optional)
**Menu:** `🔧 Mythoria Email Engine → Tests → Test Bounce Detection (Manual)`

This scans your recent 10 unread emails and reports:
- How many bounces detected
- Details of each bounce
- No actual processing happens (read-only test)

---

## 🚀 How It Works

### Automatic Processing
Your existing trigger (every 10 minutes) now:
1. Fetches unread emails
2. **NEW:** Checks for bounces FIRST
3. If bounce → classify, call API, label, archive
4. If not bounce → continues to regular processing (Phase 2)

### What Happens to Bounces
1. **Detected** - Multi-layered pattern matching
2. **Parsed** - Extract recipient, status code (5.x.x/4.x.x), reason
3. **API Call** - POST to Mythoria admin (updates lead email status)
4. **Labeled** - `Mythoria/Bounce` applied in Gmail
5. **Archived** - Moved to archive (only if API succeeds)
6. **Logged** - Recorded in `Bounces` Sheet tab

---

## 📊 Monitoring Bounces

### Check Recent Bounces
1. Open your Google Sheet
2. Go to **Bounces** tab
3. Review columns:
   - `recipient` - Who bounced
   - `statusCode` - SMTP code (5.1.1, 4.4.1, etc.)
   - `bounceType` - hard or soft
   - `reason` - Why it bounced
   - `status` - reported, api_failed, api_error

### View Bounce Patterns
**Menu:** `🔧 Mythoria Email Engine → Info → View Bounce Patterns`

Shows all active bounce detection rules from your KB.

### Run Manual Test
**Menu:** `🔧 Mythoria Email Engine → 🚀 Run Email Engine (Manual)`

Results will show:
- Processed: X
- **Bounced: Y** ← NEW
- Skipped: Z
- Errors: N

---

## 🔧 Configuration

All settings in `src/Config.js`:

```javascript
// Bounce settings
bounce_archive: true,  // Archive after successful API call
mythoria_bounce_endpoint: '/api/admin/leads/bounce',

// Labels
labels_bounce: 'Mythoria/Bounce',

// General
mark_as_read_after_processing: true
```

---

## 🐛 Troubleshooting

### "API credentials not set" warning
**Solution:** Follow step 3 above to set `mythoria_api_token`

### Bounces not detected
**Check:**
1. Menu → Info → View Bounce Patterns (are rules loaded?)
2. Is it actually a DSN? (from mailer-daemon, subject mentions "undeliverable")
3. Run Phase 3 test to validate detection logic

### API calls failing
**Check:**
1. `Errors` tab for details
2. `Bounces` tab → `status` column (should be "reported")
3. Script Properties → `mythoria_api_token` is correct
4. Test endpoint with curl (see full docs)

### Bounces not archived
**This is intentional if:**
- API call failed (kept visible for retry)
- `bounce_archive: false` in config
- Dry run mode enabled

---

## 📝 Extending Bounce Patterns

Need to detect a new bounce format?

1. **Edit `src/kb.json`** (locally)
2. **Add a new rule:**
   ```json
   {
     "id": "custom_bounce_xyz",
     "match": [
       {
         "scope": "subject",
         "pattern": "your pattern here",
         "flags": "i"
       }
     ],
     "action": {
       "type": "bounce"
     },
     "notes": "Description"
   }
   ```
3. **Push to Apps Script:** `clasp push`
4. **Test:** Menu → Tests → Test Bounce Detection (Manual)

---

## ✅ Verification Checklist

- [ ] Phase 3 test passes (Menu → Tests → Test Phase 3)
- [ ] API credentials set (Script Properties)
- [ ] `Mythoria/Bounce` label exists in Gmail
- [ ] Trigger installed and running (from Phase 2)
- [ ] Manual bounce test shows results
- [ ] Checked `Bounces` tab (may be empty if no bounces yet)

---

## 📚 Full Documentation

For complete details, see:
- **[PHASE3_COMPLETE.md](PHASE3_COMPLETE.md)** - Full implementation docs
- **[bounceAPI.md](bounceAPI.md)** - Mythoria API reference

---

## 🎯 What's Next?

**Phase 4: KB Rules Triage**
- Implement knowledge base rule matching
- Category/priority assignment from rules
- Denylist and allowlist handling
- Rule-based ticket creation

---

## 🆘 Need Help?

1. **Check Execution Log:**
   - Apps Script editor → Executions tab
   - Look for "BOUNCE DETECTED" messages

2. **Check Errors Tab:**
   - Sheet → Errors tab
   - Look for `where=BOUNCE_API` or `where=HANDLE_BOUNCE`

3. **Run Tests:**
   - Menu → Tests → Test Phase 3
   - Shows exactly what's working/failing

---

**Phase 3 is production-ready! 🚀**

Your engine now automatically handles bounces while you focus on Phase 4 development.
