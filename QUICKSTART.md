# Quick Start Guide

Get the Mythoria Email Engine running in 5 minutes!

## Prerequisites

- Google account with Gmail
- OpenAI API key (get one at https://platform.openai.com)
- 5 minutes of your time

## Setup Steps

### 1. Deploy to Google Apps Script

**Option A: Using clasp (Recommended)**

```bash
# Install dependencies
npm install

# Login to Google
npm run login

# Create new project
npm run create

# Push code
npm run push

# Open in browser
npm run open
```

**Option B: Manual Upload**

1. Go to https://script.google.com
2. Create a new project named "Mythoria Email Engine"
3. Copy each `.js` file content into separate script files
4. Copy `appsscript.json` content to the manifest

### 2. Create Google Sheets

In the Apps Script editor, run:

```javascript
createNewSpreadsheet()
```

This creates and configures a new spreadsheet automatically. Note the URL that appears in the logs!

### 3. Configure OpenAI

Run:

```javascript
setOpenAIKey('sk-your-openai-api-key-here')
```

### 4. Run Setup

Run:

```javascript
setup()
```

This will:
- ✅ Initialize all sheets
- ✅ Create default classification rules
- ✅ Test OpenAI connection
- ✅ Set up automatic trigger (every 15 minutes)

### 5. Test It!

Send a test email to `hello@mythoria.pt` and run:

```javascript
testProcessing()
```

Check the results in your Google Sheets!

## What Happens Next?

- 📧 Every 15 minutes, the engine checks for unread emails
- 🏷️ Emails are automatically classified and labeled
- 📊 All data is saved to Google Sheets
- ✅ Processed emails are marked as read

## Customization

### Change Monitored Email

```javascript
setEmailAddress('your-email@domain.com')
```

### Adjust Trigger Frequency

Edit `Config.js`:
```javascript
TRIGGER_INTERVAL_MINUTES: 30  // Change from 15 to 30 minutes
```

Then run `setupTrigger()` again.

### Add Custom Rules

Open your Google Sheets and add rows to the `KnowledgeBase` sheet:

| Rule ID | Priority | Category | Keywords | Active |
|---------|----------|----------|----------|--------|
| RULE_006 | 80 | Billing | invoice, payment, billing | TRUE |

## Verify Everything is Working

1. **Check Trigger**: Apps Script → Triggers (should see `processEmails` every 15 min)
2. **Check Sheets**: Open your spreadsheet (all 5 sheets should exist)
3. **Check Labels**: Gmail → Labels (should see Mythoria/* labels)
4. **Test Email**: Send a test email and verify it gets processed

## Need Help?

- Check the `Logs` sheet in your spreadsheet
- Review Apps Script executions: Apps Script → Executions
- See the main README.md for detailed troubleshooting

## Next Steps

- Review and customize knowledge base rules
- Monitor classifications for accuracy
- Adjust confidence thresholds if needed
- Set up notifications for urgent emails

Enjoy automated email triage! 🚀
