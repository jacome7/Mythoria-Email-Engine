# Phase 2 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Test Phase 2 ✓
```
Open Google Sheet
→ Menu: 🔧 Mythoria Email Engine
→ 🧪 Tests
→ Test Phase 2
```
**Expected:** ✓ All tests pass

---

### Step 2: Configure (Optional)
Edit `src/Config.js` and adjust:
```javascript
enabled: true,              // Master on/off switch
dry_run: false,            // true = test mode (no cache)
batch_size: 20,            // Threads per run
run_window: '08:00-20:00', // Business hours ('' = always)
```

Push changes:
```powershell
clasp push
```

---

### Step 3: Test Manually
```
Menu: 🚀 Run Email Engine (Manual)
```

**Check:**
- Messages_Log → Should show fetched threads
- Runs_Log → Should show execution metrics

**Run again:**
- Same threads should be SKIPPED (cached)

---

### Step 4: Install Trigger
```
Menu: ⏰ Triggers
→ Install Trigger (Every 10 min)
```

**Monitor:**
- Runs_Log updates every 10 minutes
- Messages_Log grows with new threads

---

### Step 5: Verify
```
Menu: ⏰ Triggers
→ List All Triggers
```
Should see: `runEmailEngine` (TIME_DRIVEN)

---

## 🎛️ Controls

### Stop Processing
```
Menu: ⏰ Triggers → Delete All Triggers
```
Or set `enabled: false` in Config.js

### View Status
```
Menu: ℹ️ Info → View Cache Stats
```

### Test Without Side Effects
```javascript
// In Config.js
dry_run: true  // Fetch but don't cache
```

---

## 📊 What to Monitor

### Every Run
- **Runs_Log**: Check `status` column (should be "completed")
- **Messages_Log**: See processed threads
- **Errors**: Should be empty

### If Issues
1. Check Errors tab
2. View execution log in Apps Script Editor
3. Verify configuration settings

---

## 🐛 Quick Fixes

| Issue | Solution |
|-------|----------|
| Trigger not running | Check enabled=true, verify trigger installed |
| No threads found | Normal if no unread mail |
| Quota exceeded | Reduce batch_size or trigger frequency |
| Threads reprocessing | Cache expires after 6h (by design) |

---

## 🎯 Phase 2 Key Metrics

**Good Run:**
```
processed: 5-20 (based on batch_size)
skipped: 0-50 (previously processed)
errors: 0
duration: 2-5 seconds
status: completed
```

**No Work:**
```
processed: 0
skipped: 0
errors: 0
status: completed
```
(No unread threads - normal)

**Error State:**
```
errors: > 0
status: error
```
→ Check Errors tab

---

## 📋 Next: Phase 3

Phase 3 will add:
- ✅ Bounce detection (DSN)
- ✅ Hard vs soft classification
- ✅ Bounce API integration
- ✅ Auto-labeling

**Current Phase 2 Status:** ✅ COMPLETE
