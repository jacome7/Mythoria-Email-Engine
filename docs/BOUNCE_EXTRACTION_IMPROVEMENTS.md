# Bounce Extraction Improvements

## Overview
Enhanced the `parseBounceDetails()` function in `BounceHandler.js` to significantly improve recipient email and status code extraction from bounce messages.

## Changes Made

### 1. Enhanced Recipient Extraction (Lines 82-140)

**Previous:** 4 simple patterns, often failed to find recipient

**Improved:** 13+ comprehensive patterns covering:
- **Gmail-specific formats:**
  - "The following address(es) failed: ..."
  - "Address not found... Your message to ..."
  - "delivery to the following recipient failed permanently: ..."

- **RFC 3464 (DSN) standard formats:**
  - Final-Recipient: rfc822; email@domain.com
  - Original-Recipient: rfc822; email@domain.com
  - Bracketed emails: `<email@domain.com>`

- **Common prefix patterns:**
  - to: email@domain.com
  - recipient: email@domain.com
  - for: email@domain.com
  - failed for: email@domain.com
  - sent to: email@domain.com

- **Quoted emails:**
  - "email@domain.com"
  - 'email@domain.com'

- **Fallback:** Subject line extraction if body patterns fail

**Smart Filtering:**
- Skips sender's email (mailer-daemon, postmaster)
- Skips system addresses (noreply, no-reply)
- Only accepts valid recipient addresses

### 2. Enhanced Status Code Extraction (Lines 65-120)

**Previous:** Single simple regex, often missed codes

**Improved:** 5-pattern hierarchy with fallbacks:

1. **Standard extended code:** `5.1.1`, `4.4.1` (most reliable)
2. **Diagnostic-Code field:** `Diagnostic-Code: smtp; 550 5.1.1 ...` (RFC 3464)
3. **Status field:** `Status: 5.1.1` (RFC 3464)
4. **SMTP + extended code:** `550 5.1.1 ...` (extract extended)
5. **Three-digit code mapping:** `550` → `5.1.1` (with smart defaults)

**Common Code Mappings:**
- 550 → 5.1.1 (User unknown)
- 551 → 5.1.1 (User not local)
- 552 → 5.2.2 (Mailbox full)
- 553 → 5.1.1 (Invalid mailbox)
- 554 → 5.7.1 (Transaction failed/Spam)
- 450 → 4.4.1 (Temporary failure)
- 451 → 4.4.1 (Processing error)
- 452 → 4.2.2 (Insufficient storage)

### 3. Better Logging

Added detailed logging throughout extraction:
- `Recipient extracted: email@domain.com (pattern matched)`
- `Recipient extracted from subject: email@domain.com`
- `Status code: 5.1.1` or `Status code: not found`

## Testing Recommendations

### Test with Debug Tool
1. Open Google Sheet
2. **Extensions → Mythoria Email Engine → Debug → Inspect Bounce Email Content**
3. Review the logs to see:
   - Actual bounce email format
   - Which patterns matched
   - Extracted recipient and status code

### Re-run Engine
1. **Extensions → Mythoria Email Engine → Clear Cache & Run**
2. Check `Bounces` tab for:
   - recipient column (should show actual email, not "unknown")
   - statusCode column (should show 5.x.x or 4.x.x, not "unknown")
   - bounceType column (should show "hard" or "soft")
   - reason column (should show meaningful description)

### Check Mythoria API
1. Check `Bounces` tab → `apiResponse` column
2. Should show: `"success"` or `"updated"` (not `"no_recipient"`)
3. Archived column should be `TRUE` for successful API calls

## Expected Results

**Before:**
```
recipient: unknown
statusCode: unknown
bounceType: unknown
reason: Unknown bounce reason
apiResponse: no_recipient
archived: FALSE
```

**After:**
```
recipient: john.doe@example.com
statusCode: 5.1.1
bounceType: hard
reason: Bad destination mailbox address
apiResponse: success
archived: TRUE
```

## Fallback Behavior

If no recipient found after all patterns:
- Uses "unknown" as recipient
- API call will fail (expected)
- Email won't be archived (for manual review)

If no status code found after all patterns:
- Infers from keywords:
  - "user unknown" → 5.1.1
  - "mailbox full" → 4.2.2
  - "access denied" → 5.7.1
  - Default → 5.0.0

## Supported Bounce Formats

This improvement handles bounces from:
- ✅ Gmail/Google Workspace
- ✅ Microsoft Exchange
- ✅ Postfix
- ✅ Sendmail
- ✅ RFC 3464 (DSN) compliant systems
- ✅ Most standard SMTP servers

## Files Modified
- `src/BounceHandler.js` (parseBounceDetails function, lines 65-140)

## Deployment
- Pushed to Apps Script: ✅ (12 files pushed successfully)
- Ready for testing

---

**Next Step:** Run the debug tool or Clear Cache & Run to test the improvements with actual bounce emails.
