/**
 * Main entry point for Mythoria Email Engine
 * Google Apps Script functions that can be called from triggers
 */

/**
 * Main function to process emails - called by time-driven trigger
 */
function processEmails() {
  try {
    logMessage('INFO', '=== Email Processing Started ===');
    const result = EmailTriageEngine.processUnreadEmails();
    logMessage('INFO', '=== Email Processing Completed ===', result);
    return result;
  } catch (e) {
    logMessage('ERROR', 'Email processing failed', { error: e.message, stack: e.stack });
    throw e;
  }
}

/**
 * Manual trigger function - can be run from Apps Script editor
 */
function manualProcessEmails() {
  const result = processEmails();
  Logger.log('Processing complete: ' + JSON.stringify(result));
  return result;
}

/**
 * Setup function - initializes the environment
 */
function setup() {
  try {
    logMessage('INFO', 'Starting setup...');
    
    // Initialize configuration
    initializeConfig();
    
    // Check if spreadsheet is configured
    if (!CONFIG.SPREADSHEET_ID) {
      throw new Error('Please set SPREADSHEET_ID in Config.js or Script Properties');
    }
    
    // Initialize all sheets
    SheetsService.initializeAllSheets();
    
    // Populate default knowledge base rules if empty
    const rules = SheetsService.getKnowledgeBaseRules();
    if (rules.length === 0) {
      logMessage('INFO', 'Knowledge base is empty, populating default rules');
      KnowledgeBase.populateDefaultRules();
    }
    
    // Test OpenAI connection if API key is configured
    if (CONFIG.OPENAI_API_KEY) {
      logMessage('INFO', 'Testing OpenAI connection...');
      OpenAIService.testConnection();
    } else {
      logMessage('WARN', 'OpenAI API key not configured. AI classification will be disabled.');
    }
    
    // Create time-driven trigger
    setupTrigger();
    
    logMessage('INFO', 'Setup completed successfully!');
    Logger.log('Setup completed! You can now run processEmails() or wait for the trigger.');
    
  } catch (e) {
    logMessage('ERROR', 'Setup failed', { error: e.message, stack: e.stack });
    throw e;
  }
}

/**
 * Create time-driven trigger
 */
function setupTrigger() {
  // Delete existing triggers for processEmails
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processEmails') {
      ScriptApp.deleteTrigger(trigger);
      logMessage('INFO', 'Deleted existing trigger');
    }
  });
  
  // Create new trigger - runs every 15 minutes
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(CONFIG.TRIGGER_INTERVAL_MINUTES)
    .create();
  
  logMessage('INFO', `Created time-driven trigger (every ${CONFIG.TRIGGER_INTERVAL_MINUTES} minutes)`);
}

/**
 * Remove all triggers
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processEmails') {
      ScriptApp.deleteTrigger(trigger);
      logMessage('INFO', 'Deleted trigger');
    }
  });
  Logger.log('All triggers removed');
}

/**
 * Test function - processes a small batch for testing
 */
function testProcessing() {
  try {
    logMessage('INFO', '=== Test Processing Started ===');
    
    // Initialize configuration
    initializeConfig();
    
    // Get just one unread email for testing
    const query = `to:${CONFIG.EMAIL_ADDRESS} is:unread`;
    const threads = GmailApp.search(query, 0, 1);
    
    if (threads.length === 0) {
      Logger.log('No unread emails found for testing');
      logMessage('INFO', 'No unread emails found for testing');
      return;
    }
    
    const messages = threads[0].getMessages();
    const message = messages[messages.length - 1]; // Get last message in thread
    
    if (!message.isUnread()) {
      Logger.log('Message is not unread');
      return;
    }
    
    logMessage('INFO', 'Testing with email', {
      subject: message.getSubject(),
      from: message.getFrom()
    });
    
    const result = EmailTriageEngine.processEmail(message);
    
    Logger.log('Test result: ' + JSON.stringify(result, null, 2));
    logMessage('INFO', '=== Test Processing Completed ===', result);
    
    return result;
    
  } catch (e) {
    Logger.log('Test failed: ' + e.message);
    logMessage('ERROR', 'Test processing failed', { error: e.message, stack: e.stack });
    throw e;
  }
}

/**
 * Configuration helper - set OpenAI API key
 */
function setOpenAIKey(apiKey) {
  setConfigProperty('OPENAI_API_KEY', apiKey);
  Logger.log('OpenAI API key set successfully');
}

/**
 * Configuration helper - set Spreadsheet ID
 */
function setSpreadsheetId(spreadsheetId) {
  setConfigProperty('SPREADSHEET_ID', spreadsheetId);
  Logger.log('Spreadsheet ID set successfully');
}

/**
 * Configuration helper - set email address
 */
function setEmailAddress(emailAddress) {
  setConfigProperty('EMAIL_ADDRESS', emailAddress);
  Logger.log('Email address set successfully');
}

/**
 * Get current configuration status
 */
function getConfigStatus() {
  initializeConfig();
  
  const status = {
    emailAddress: CONFIG.EMAIL_ADDRESS,
    spreadsheetId: CONFIG.SPREADSHEET_ID ? 'Configured' : 'Not configured',
    openAIKey: CONFIG.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    batchSize: CONFIG.BATCH_SIZE,
    triggerInterval: CONFIG.TRIGGER_INTERVAL_MINUTES
  };
  
  Logger.log('Configuration status:');
  Logger.log(JSON.stringify(status, null, 2));
  
  return status;
}

/**
 * Create a new spreadsheet for the email engine
 */
function createNewSpreadsheet() {
  const spreadsheet = SpreadsheetApp.create('Mythoria Email Engine Data');
  const spreadsheetId = spreadsheet.getId();
  const spreadsheetUrl = spreadsheet.getUrl();
  
  Logger.log('Created new spreadsheet:');
  Logger.log('ID: ' + spreadsheetId);
  Logger.log('URL: ' + spreadsheetUrl);
  
  // Set the spreadsheet ID
  setSpreadsheetId(spreadsheetId);
  
  // Initialize sheets
  CONFIG.SPREADSHEET_ID = spreadsheetId;
  SheetsService.initializeAllSheets();
  
  logMessage('INFO', 'Created new spreadsheet', { id: spreadsheetId, url: spreadsheetUrl });
  
  return { id: spreadsheetId, url: spreadsheetUrl };
}
