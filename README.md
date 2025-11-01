# Mythoria Email Engine

Automated email triage system for `hello@mythoria.pt` using Google Apps Script, OpenAI, and rules-based classification.

## Overview

The Mythoria Email Engine automatically processes unread emails sent to `hello@mythoria.pt`, classifies them using a combination of rules-based knowledge base and OpenAI, generates summaries, and applies appropriate Gmail labels. All operational data is stored in Google Sheets for easy tracking and analysis.

## Features

- 🤖 **Automated Email Triage**: Processes unread emails automatically via time-driven triggers
- 📊 **Dual Classification**: Uses both rules-based knowledge base and OpenAI for accurate categorization
- 📝 **AI Summaries**: Generates concise summaries with key points and sentiment analysis
- 🏷️ **Smart Labels**: Automatically applies Gmail labels based on classification
- 📈 **Google Sheets Integration**: Stores all data in organized sheets for analysis
- ⚙️ **Configurable**: Easy configuration via Script Properties or code
- 🔄 **Retry Logic**: Built-in exponential backoff for API calls
- 📋 **Comprehensive Logging**: Detailed logs for monitoring and debugging

## Architecture

### Components

1. **Code.js** - Main entry point with trigger functions
2. **EmailTriageEngine.js** - Core email processing logic
3. **KnowledgeBase.js** - Rules-based classification system
4. **OpenAIService.js** - AI-powered classification and summarization
5. **SheetsService.js** - Google Sheets data persistence
6. **Config.js** - Configuration management
7. **Utils.js** - Utility functions

### Email Processing Flow

```
Unread Email → Knowledge Base Classification → OpenAI Classification (if needed)
                                              ↓
                                    OpenAI Summarization
                                              ↓
                                    Apply Gmail Labels
                                              ↓
                                    Save to Google Sheets
                                              ↓
                                      Mark as Read
```

## Setup Instructions

### Prerequisites

- Google Account with Gmail access
- Google Apps Script access
- OpenAI API key (optional but recommended)
- Node.js and npm (for clasp development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jacome7/Mythoria-Email-Engine.git
   cd Mythoria-Email-Engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to clasp**
   ```bash
   npm run login
   ```

4. **Create a new Apps Script project**
   ```bash
   npm run create
   ```
   
   Or link to an existing project by creating `.clasp.json`:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "."
   }
   ```

5. **Push code to Apps Script**
   ```bash
   npm run push
   ```

6. **Configure the engine**
   
   Open the Apps Script editor:
   ```bash
   npm run open
   ```
   
   Then run the setup wizard:
   
   **Option A: Using the Apps Script Editor**
   
   a. Create a new spreadsheet by running:
   ```javascript
   createNewSpreadsheet()
   ```
   This will create a spreadsheet and automatically configure it.
   
   b. Set your OpenAI API key:
   ```javascript
   setOpenAIKey('your-openai-api-key')
   ```
   
   c. Optionally, set a custom email address:
   ```javascript
   setEmailAddress('hello@mythoria.pt')
   ```
   
   **Option B: Manual Configuration**
   
   Edit `Config.js` and set:
   - `SPREADSHEET_ID`: Your Google Sheets ID
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `EMAIL_ADDRESS`: Email address to monitor (default: hello@mythoria.pt)

7. **Run initial setup**
   ```javascript
   setup()
   ```
   
   This will:
   - Initialize all Google Sheets
   - Populate default knowledge base rules
   - Test OpenAI connection
   - Create time-driven trigger (runs every 15 minutes)

### Manual Configuration via Script Properties

You can also set configuration via Script Properties (recommended for security):

1. In Apps Script editor, go to **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Add properties:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SPREADSHEET_ID`: Your Google Sheets ID
   - `EMAIL_ADDRESS`: Email to monitor

## Usage

### Automatic Processing

Once setup is complete, the engine automatically processes emails every 15 minutes via the time-driven trigger.

### Manual Processing

Run from Apps Script editor:

```javascript
// Process all unread emails
manualProcessEmails()

// Test with a single email
testProcessing()

// Check configuration status
getConfigStatus()
```

### Managing Triggers

```javascript
// Create/recreate trigger
setupTrigger()

// Remove all triggers
removeTriggers()
```

## Google Sheets Structure

The engine creates the following sheets:

### 1. ProcessedEmails
Stores all processed email records:
- Timestamp, Email ID, Thread ID, Subject, From, Date
- Classification, Confidence, Summary, Labels

### 2. KnowledgeBase
Rules-based classification rules:
- Rule ID, Priority, Category, Keywords
- Sender Pattern, Subject Pattern, Body Pattern
- Action, Active status

### 3. Classifications
Detailed classification results:
- Timestamp, Email ID, Category, Confidence
- Method (knowledge_base/openai/fallback), Reasoning

### 4. Summaries
AI-generated summaries:
- Timestamp, Email ID, Summary
- Key Points, Sentiment

### 5. Logs
System logs:
- Timestamp, Level, Message, Data

## Classification Categories

The engine classifies emails into these categories:

- **Support**: Help requests, issues, problems, bugs
- **Sales**: Pricing, quotes, purchases, invoices
- **Technical**: API, integration, developer questions
- **General**: General inquiries and questions
- **Urgent**: Time-sensitive or critical emails
- **Low Priority**: Non-urgent items

## Gmail Labels

The engine creates and applies these labels:

- `Mythoria/Processed` - All processed emails
- `Mythoria/Support` - Support requests
- `Mythoria/Sales` - Sales inquiries
- `Mythoria/Technical` - Technical questions
- `Mythoria/General` - General emails
- `Mythoria/Urgent` - Urgent items
- `Mythoria/LowPriority` - Low priority items

## Knowledge Base Rules

Default rules are automatically created during setup. You can customize them by editing the `KnowledgeBase` sheet:

### Rule Structure
- **Rule ID**: Unique identifier (e.g., RULE_001)
- **Priority**: Higher numbers = higher priority (0-100)
- **Category**: Classification category
- **Keywords**: Comma-separated keywords (case-insensitive)
- **Sender Pattern**: Regex pattern for sender email
- **Subject Pattern**: Regex pattern for subject
- **Body Pattern**: Regex pattern for email body
- **Action**: Action to take (e.g., label_support)
- **Active**: TRUE/FALSE to enable/disable rule

### Example Rules

| Rule ID | Priority | Category | Keywords | Active |
|---------|----------|----------|----------|--------|
| RULE_001 | 100 | Support | help, issue, problem, error, bug | TRUE |
| RULE_002 | 90 | Sales | price, quote, purchase, buy | TRUE |
| RULE_003 | 95 | Urgent | urgent, asap, emergency | TRUE |

## Configuration Options

### In Config.js

```javascript
const CONFIG = {
  EMAIL_ADDRESS: 'hello@mythoria.pt',
  BATCH_SIZE: 50,
  SPREADSHEET_ID: '',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: 'gpt-4',
  OPENAI_MAX_TOKENS: 500,
  CONFIDENCE_THRESHOLD: 0.7,
  TRIGGER_INTERVAL_MINUTES: 15
};
```

### Key Settings

- **BATCH_SIZE**: Number of emails to process per run (default: 50)
- **CONFIDENCE_THRESHOLD**: Minimum confidence for rule matching (0-1, default: 0.7)
- **TRIGGER_INTERVAL_MINUTES**: How often to check for new emails (default: 15)
- **OPENAI_MODEL**: OpenAI model to use (gpt-4, gpt-3.5-turbo, etc.)
- **OPENAI_MAX_TOKENS**: Maximum tokens for OpenAI responses

## Monitoring and Logs

### View Logs

1. **In Google Sheets**: Check the "Logs" sheet for detailed system logs
2. **In Apps Script**: Go to "Executions" to see trigger runs
3. **Use clasp**: Run `npm run logs` to view recent logs

### Check Processing Status

```javascript
// View recent classifications
// Open Sheets → Classifications sheet

// View processing statistics
// Check ProcessedEmails sheet for counts and trends
```

## Troubleshooting

### No emails being processed

1. Check configuration: `getConfigStatus()`
2. Verify trigger is active: Check Apps Script → Triggers
3. Check email query: Ensure emails are sent to configured address
4. Review logs: Check Logs sheet or Apps Script executions

### OpenAI errors

1. Verify API key: `setOpenAIKey('your-key')`
2. Check API quota: Visit OpenAI dashboard
3. Review error logs: Check Logs sheet
4. Test connection: Run `OpenAIService.testConnection()`

### Permission errors

1. Run `setup()` again to grant permissions
2. Check OAuth scopes in `appsscript.json`
3. Reauthorize the script in Apps Script editor

### Sheets not created

1. Verify SPREADSHEET_ID is set
2. Run `SheetsService.initializeAllSheets()`
3. Check spreadsheet permissions

## Development

### Local Development with clasp

```bash
# Pull latest code from Apps Script
clasp pull

# Make changes locally

# Push changes to Apps Script
npm run push

# View logs
npm run logs

# Open in browser
npm run open
```

### Testing

```javascript
// Test with one email
testProcessing()

// Test configuration
getConfigStatus()

// Test OpenAI connection
OpenAIService.testConnection()

// Test knowledge base
KnowledgeBase.classify(emailData)
```

## Best Practices

1. **Start with rules**: Define knowledge base rules before relying on AI
2. **Monitor regularly**: Check Logs and Classifications sheets weekly
3. **Adjust confidence**: Tune `CONFIDENCE_THRESHOLD` based on accuracy
4. **Update rules**: Refine knowledge base based on misclassifications
5. **Manage quota**: Monitor OpenAI API usage and costs
6. **Backup data**: Regularly backup the Google Sheets

## Security

- **Never commit** `.clasprc.json` or API keys to version control
- Use **Script Properties** for sensitive configuration
- Restrict spreadsheet access to authorized users only
- Review OAuth scopes regularly
- Enable 2FA on Google account

## Costs

- **Google Apps Script**: Free (within quotas)
- **Google Sheets**: Free (within storage limits)
- **OpenAI API**: Pay-per-use (approximately $0.01-0.03 per email with GPT-4)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Review the Logs sheet for error details
- Check Apps Script execution logs

## License

MIT License - See LICENSE file for details

## Credits

Developed for Mythoria by the automation team.

---

**Version**: 1.0.0  
**Last Updated**: November 2025