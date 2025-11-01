# Deployment Guide

Complete guide for deploying the Mythoria Email Engine to production.

## Pre-Deployment Checklist

- [ ] Google account with Gmail access
- [ ] OpenAI API key (if using AI features)
- [ ] Google Sheets created or ID ready
- [ ] Email address configured (hello@mythoria.pt)
- [ ] Tested locally with sample emails
- [ ] Reviewed and customized knowledge base rules

## Deployment Methods

### Method 1: Using clasp (Recommended)

This is the recommended method for development and production deployment.

#### Step 1: Install clasp

```bash
npm install -g @google/clasp
```

#### Step 2: Login to Google

```bash
clasp login
```

This opens a browser window for Google authentication.

#### Step 3: Create New Project

```bash
clasp create --title "Mythoria Email Engine" --type standalone
```

Or clone an existing project:

```bash
clasp clone <scriptId>
```

#### Step 4: Push Code

```bash
clasp push
```

Confirm when prompted to overwrite remote files.

#### Step 5: Open in Browser

```bash
clasp open
```

#### Step 6: Configure and Setup

In the Apps Script editor:

1. Run `createNewSpreadsheet()` to create the data spreadsheet
2. Run `setOpenAIKey('your-api-key')` to set your OpenAI key
3. Run `setup()` to initialize everything

### Method 2: Manual Deployment

If you prefer not to use clasp or have restrictions:

#### Step 1: Create Project

1. Go to https://script.google.com
2. Click "New Project"
3. Name it "Mythoria Email Engine"

#### Step 2: Add Script Files

For each `.js` file in the repository:

1. Click the `+` next to "Files"
2. Choose "Script"
3. Name it (e.g., "Config")
4. Copy and paste the content from the `.js` file

Create files in this order:
1. Config.js
2. Utils.js
3. SheetsService.js
4. KnowledgeBase.js
5. OpenAIService.js
6. EmailTriageEngine.js
7. Code.js

#### Step 3: Update Manifest

1. Click on "Project Settings" (gear icon)
2. Check "Show appsscript.json in editor"
3. Go back to editor
4. Click on `appsscript.json`
5. Replace content with the `appsscript.json` from repository

#### Step 4: Configure and Setup

Same as clasp method - run the configuration functions.

## Configuration for Production

### 1. Set Up Script Properties

Using Script Properties is more secure than hardcoding:

```javascript
// In Apps Script editor
function configureProduction() {
  const props = PropertiesService.getScriptProperties();
  
  props.setProperties({
    'OPENAI_API_KEY': 'sk-your-production-key',
    'SPREADSHEET_ID': 'your-spreadsheet-id',
    'EMAIL_ADDRESS': 'hello@mythoria.pt'
  });
  
  Logger.log('Production configuration set');
}
```

Run `configureProduction()` once.

### 2. Create Production Spreadsheet

```javascript
// Create a dedicated production spreadsheet
const result = createNewSpreadsheet();
Logger.log('Spreadsheet URL: ' + result.url);
Logger.log('Spreadsheet ID: ' + result.id);
```

Save the ID for your records.

### 3. Set Up Gmail Filters (Optional)

Create Gmail filters to mark emails for processing:

1. Go to Gmail Settings → Filters and Blocked Addresses
2. Create a filter:
   - To: hello@mythoria.pt
   - Star it / Add label (for tracking)
3. Save filter

### 4. Configure Trigger

Default trigger runs every 15 minutes. To customize:

```javascript
// In Config.js, change:
TRIGGER_INTERVAL_MINUTES: 30  // Run every 30 minutes
```

Then run `setupTrigger()` to recreate the trigger.

### 5. Set Up Notifications (Optional)

Add email notifications for errors:

```javascript
// In Code.js, modify processEmails()
function processEmails() {
  try {
    // ... existing code ...
  } catch (e) {
    MailApp.sendEmail({
      to: 'admin@mythoria.pt',
      subject: 'Email Engine Error',
      body: 'Error: ' + e.message
    });
    throw e;
  }
}
```

## Security Best Practices

### 1. Protect API Keys

- ✅ Use Script Properties instead of hardcoding
- ✅ Never commit `.clasprc.json` to version control
- ✅ Use environment-specific keys (dev vs. prod)
- ✅ Rotate keys regularly

### 2. Restrict Spreadsheet Access

1. Open your Google Sheets
2. Click "Share"
3. Set permissions:
   - Remove "Anyone with link"
   - Add specific users only
   - Use "Viewer" or "Commenter" for most users
   - Keep "Editor" for admins only

### 3. Review OAuth Scopes

The script requires these permissions:
- Gmail: Read, modify, labels
- Sheets: Read, write
- External requests: For OpenAI API

Review `appsscript.json` to ensure only necessary scopes are included.

### 4. Enable 2FA

Enable two-factor authentication on the Google account running the script.

### 5. Monitor Access

Regularly review:
- Apps Script executions
- Spreadsheet access logs
- Gmail filter activity

## Monitoring Setup

### 1. Apps Script Dashboard

Monitor executions:
1. Go to https://script.google.com
2. Click on your project
3. Click "Executions" (left sidebar)
4. Review recent runs for errors

### 2. Set Up Alerts

```javascript
// Add to Code.js
function dailySummary() {
  const sheet = SheetsService.getSheet(CONFIG.SHEETS.LOGS);
  const data = sheet.getDataRange().getValues();
  
  // Count errors in last 24 hours
  const yesterday = new Date(Date.now() - 24*60*60*1000);
  let errorCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] > yesterday && data[i][1] === 'ERROR') {
      errorCount++;
    }
  }
  
  if (errorCount > 0) {
    MailApp.sendEmail({
      to: 'admin@mythoria.pt',
      subject: 'Daily Email Engine Summary',
      body: `Errors in last 24 hours: ${errorCount}`
    });
  }
}
```

Create daily trigger for `dailySummary()`.

### 3. Google Sheets Notifications

Set up email notifications in Google Sheets:
1. Open your spreadsheet
2. Tools → Notification rules
3. Set rules for when data changes

## Testing in Production

### 1. Smoke Test

After deployment, run:

```javascript
testProcessing()
```

Verify:
- ✅ Email is processed
- ✅ Classification works
- ✅ Labels applied
- ✅ Data saved to sheets
- ✅ No errors in logs

### 2. Load Test

Send multiple test emails:

```javascript
// Process batch
manualProcessEmails()
```

Check:
- Processing time
- API quota usage
- Memory usage (in executions log)

### 3. Monitor First Week

Watch for:
- Misclassifications
- API errors
- Performance issues
- Unexpected patterns

## Rollback Plan

If issues occur:

### 1. Disable Trigger

```javascript
removeTriggers()
```

### 2. Revert to Previous Version

With clasp:
```bash
# View versions
clasp versions

# Deploy specific version
clasp deploy --versionNumber <number>
```

### 3. Manual Intervention

Process emails manually while troubleshooting:
```javascript
manualProcessEmails()
```

## Performance Optimization

### For High Volume (1000+ emails/day)

1. **Increase batch size:**
   ```javascript
   BATCH_SIZE: 100
   ```

2. **Run more frequently:**
   ```javascript
   TRIGGER_INTERVAL_MINUTES: 5
   ```

3. **Use faster AI model:**
   ```javascript
   OPENAI_MODEL: 'gpt-3.5-turbo'
   ```

4. **Optimize rules:**
   - Add more specific rules to reduce AI calls
   - Increase priority of common patterns

### For Cost Optimization

1. **Use rules primarily:**
   - Comprehensive knowledge base
   - High confidence threshold

2. **Reduce AI usage:**
   ```javascript
   CONFIDENCE_THRESHOLD: 0.8  // Only use AI if rules score < 0.8
   ```

3. **Cheaper AI model:**
   ```javascript
   OPENAI_MODEL: 'gpt-3.5-turbo'
   OPENAI_MAX_TOKENS: 200
   ```

## Maintenance

### Weekly Tasks

- Review Classifications sheet for accuracy
- Check Logs sheet for errors
- Verify trigger is running
- Monitor OpenAI usage and costs

### Monthly Tasks

- Update knowledge base rules
- Review and optimize performance
- Check for Apps Script updates
- Backup spreadsheet data
- Rotate API keys

### Quarterly Tasks

- Full security audit
- Performance analysis
- Cost optimization review
- User feedback collection

## Backup and Recovery

### Backup Spreadsheet

1. File → Download → Excel (.xlsx)
2. Or use Google Takeout for automated backups
3. Store backups securely

### Backup Code

All code is in the repository:
```bash
git push origin main
```

Use tags for versions:
```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

### Recovery

1. Restore from clasp: `clasp push`
2. Recreate spreadsheet: `createNewSpreadsheet()`
3. Import backup data to sheets
4. Run `setup()` again

## Post-Deployment

### 1. Document

Record:
- Deployment date
- Script ID
- Spreadsheet ID
- Configuration used
- Any custom modifications

### 2. Training

Train your team:
- How to view processed emails
- How to check classifications
- How to add new rules
- How to monitor the system

### 3. Handoff

Provide:
- Access credentials
- Documentation links
- Support contact
- Escalation procedures

## Support

For issues during deployment:
- Check troubleshooting guide
- Review execution logs
- Test individual components
- Contact repository maintainers

## Success Criteria

Deployment is successful when:
- ✅ Trigger runs without errors
- ✅ Emails are classified accurately (>80%)
- ✅ Labels are applied correctly
- ✅ Data is saved to sheets
- ✅ No quota issues
- ✅ Performance is acceptable
- ✅ Team can access and use the system

---

**Last Updated**: November 2025
