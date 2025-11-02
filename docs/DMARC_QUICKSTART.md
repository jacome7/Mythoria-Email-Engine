# DMARC Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Initialize the DMARC_Health Sheet
1. Open your Google Apps Script project: `clasp open`
2. Run the function: `initializeDmarcHealthTab()`
3. Verify the new sheet appears with headers

### Step 2: Create Gmail Label
Run this function in Apps Script editor:
```javascript
initializeGmailLabels()
```

This creates the `Mythoria/DMARC` label (and ensures other labels exist).

### Step 3: Label Your First DMARC Report

#### Option A: Manual (Testing)
1. Go to your Gmail `hello@` mailbox
2. Find a DMARC aggregate report (usually from Google, Microsoft, etc.)
3. Apply label: `Mythoria/DMARC`
4. Leave message unread

#### Option B: Automatic (Production)
Create a Gmail filter:
- **From:** `noreply-dmarc@google.com OR noreply@dmarc.microsoft.com`
- **Has:** `attachment`
- **Apply label:** `Mythoria/DMARC`
- **Never send to Spam**

### Step 4: Test Processing

Run manually in Apps Script editor:
```javascript
processDmarcReports()
```

Check the execution log for:
- Messages fetched
- Reports parsed
- Health rows updated

### Step 5: Verify Results

Open your Google Sheet and check the `DMARC_Health` tab:
- Should have one row per date × domain
- Check health status (OK/WATCH/ACTION)
- Review health notes

### Step 6: Enable Automatic Processing

The feature is already integrated! On every trigger run:
1. Main email processing happens first
2. Then DMARC reports are processed automatically

No additional trigger needed.

## 📊 What to Expect

### First Run
- Processes all unread messages with `Mythoria/DMARC` label
- Deletes messages after processing
- Creates rows in DMARC_Health sheet

### Ongoing
- Runs on same schedule as main engine
- Processes new DMARC reports automatically
- Updates existing date×domain rows (latest wins)

## ⚙️ Configuration (Optional)

Edit `Config.js` if needed:

```javascript
// Disable DMARC processing
dmarc_enabled: false

// Change label name
dmarc_label: 'My-Custom-Label'

// Process fewer messages per run
dmarc_batch_size: 25

// Keep messages instead of deleting
dmarc_delete_after_processing: false
```

## 🔍 Monitoring

### Daily Check
Review `DMARC_Health` sheet for:
- **ACTION** status - Critical issues requiring immediate attention
- **WATCH** status - Marginal metrics to monitor
- **OK** status - Healthy metrics

### Errors
Check `Errors` sheet for:
- Parse failures
- Missing attachments
- Decompression errors

### Logs
Check Apps Script execution logs for:
- Number of messages processed
- Health rows updated
- Any warnings

## 🎯 Success Criteria

✅ DMARC_Health sheet exists with proper headers
✅ Gmail label `Mythoria/DMARC` created
✅ First report processed successfully
✅ Health status calculated correctly
✅ Processed message deleted (if enabled)
✅ No errors in Errors sheet

## 🐛 Troubleshooting

### No data in sheet?
- Verify messages have `Mythoria/DMARC` label
- Check messages are unread
- Run `processDmarcReports()` manually
- Check execution logs for errors

### Parse errors?
- Verify attachment is actually a DMARC report
- Check if XML is well-formed
- Look at Errors sheet for details

### Messages not deleted?
- Check `dmarc_delete_after_processing` config
- Verify no errors during processing
- Check if dry_run mode is enabled

## 📝 Sample Health Row

```
Date: 2025-11-01
Domain: mythoria.pt
Total Messages: 1,250
DMARC Pass Rate: 98.5%
Quarantine Count: 0
Reject Count: 0
SPF Aligned Pass Rate: 97.8%
DKIM Aligned Pass Rate: 98.2%
Health Status: OK
Health Note: All metrics healthy
```

## 🔗 Resources

- [Full Implementation Doc](./DMARC_IMPLEMENTATION.md)
- [RFC 7489 - DMARC](https://datatracker.ietf.org/doc/html/rfc7489)
- [DMARC.org](https://dmarc.org/)

---

**Ready to go!** The feature is live and will process DMARC reports on every engine run.
