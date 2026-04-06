/**
 * Mythoria Email Engine - Initialization Functions
 * 
 * Functions to set up Sheet tabs and Gmail labels for the current runtime.
 */

/**
 * Initialize all Sheet tabs with proper headers and formatting
 * Run this once to set up the spreadsheet structure
 * 
 * NOTE: Config is now in Config.js, not in a Sheet tab
 */
function initializeSheetTabs() {
  Logger.log('Starting Sheet initialization...');
  
  try {
    initializeRunsLogTab();
    initializeMessagesLogTab();
    initializeBouncesTab();
    initializeTicketsTab();
    initializeErrorsTab();
    initializeDmarcHealthTab();
    
    // Show success message
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Success! ✓',
      'All sheet tabs have been initialized successfully.\n\n' +
      'Tabs created:\n' +
      '• Runs_Log\n' +
      '• Messages_Log\n' +
      '• Bounces\n' +
      '• Tickets\n' +
      '• Errors\n' +
      '• DMARC_Health\n\n' +
      'NOTE: Configuration is now stored in Config.js, not in a Sheet tab.',
      ui.ButtonSet.OK
    );
    
    Logger.log('Sheet initialization complete!');
    
  } catch (error) {
    Logger.log('ERROR during sheet initialization: ' + error.message);
    throw error;
  }
}

/**
 * Initialize Runs_Log tab
 */
function initializeRunsLogTab() {
  const sheet = getOrCreateSheet('Runs_Log');
  sheet.clear();
  
  const headers = [[
    'Timestamp',
    'Duration (s)',
    'Processed',
    'Ticketed',
    'Bounced',
    'Skipped',
    'Drafted',
    'Warnings',
    'Errors',
    'Status'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 160);
  sheet.setFrozenRows(1);
  
  Logger.log('Runs_Log tab initialized');
}

/**
 * Initialize Messages_Log tab
 */
function initializeMessagesLogTab() {
  const sheet = getOrCreateSheet('Messages_Log');
  sheet.clear();
  
  const headers = [[
    'Timestamp',
    'Thread ID',
    'Message ID',
    'From',
    'Subject',
    'Category',
    'Priority',
    'Action',
    'Rule/Source',
    'Ticket ID',
    'Draft ID',
    'Labels'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#FBBC04')
    .setFontColor('#000000')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(4, 250);
  sheet.setColumnWidth(5, 300);
  sheet.setFrozenRows(1);
  
  Logger.log('Messages_Log tab initialized');
}

/**
 * Initialize Bounces tab
 */
function initializeBouncesTab() {
  const sheet = getOrCreateSheet('Bounces');
  sheet.clear();
  
  const headers = [[
    'Timestamp',
    'Thread ID',
    'Message ID',
    'Recipient',
    'Status Code',
    'Bounce Type',
    'Reason',
    'API Response',
    'Status'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(4, 250);
  sheet.setColumnWidth(7, 300);
  sheet.setFrozenRows(1);
  
  Logger.log('Bounces tab initialized');
}

/**
 * Initialize Tickets tab
 */
function initializeTicketsTab() {
  const sheet = getOrCreateSheet('Tickets');
  sheet.clear();
  
  const headers = [[
    'Thread ID',
    'Ticket ID',
    'Category',
    'Priority',
    'Status',
    'Created At',
    'Updated At'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#9C27B0')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(6, 160);
  sheet.setColumnWidth(7, 160);
  sheet.setFrozenRows(1);
  
  Logger.log('Tickets tab initialized');
}

/**
 * Initialize Errors tab
 */
function initializeErrorsTab() {
  const sheet = getOrCreateSheet('Errors');
  sheet.clear();
  
  const headers = [[
    'Timestamp',
    'Context',
    'Message',
    'Details',
    'Retry Count',
    'Resolved'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#FF6D00')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 400);
  sheet.setFrozenRows(1);
  
  Logger.log('Errors tab initialized');
}

/**
 * Initialize DMARC_Health tab
 */
function initializeDmarcHealthTab() {
  const sheet = getOrCreateSheet('DMARC_Health');
  sheet.clear();
  
  const headers = [[
    'Date',
    'Domain',
    'Total Messages',
    'DMARC Pass Rate (%)',
    'Quarantine Count',
    'Reject Count',
    'SPF Aligned Pass Rate (%)',
    'DKIM Aligned Pass Rate (%)',
    'Health Status',
    'Health Note'
  ]];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  
  // Format
  sheet.getRange(1, 1, 1, headers[0].length)
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 100);  // Date
  sheet.setColumnWidth(2, 150);  // Domain
  sheet.setColumnWidth(3, 120);  // Total Messages
  sheet.setColumnWidth(4, 150);  // DMARC Pass Rate
  sheet.setColumnWidth(5, 130);  // Quarantine Count
  sheet.setColumnWidth(6, 120);  // Reject Count
  sheet.setColumnWidth(7, 180);  // SPF Aligned Pass Rate
  sheet.setColumnWidth(8, 180);  // DKIM Aligned Pass Rate
  sheet.setColumnWidth(9, 120);  // Health Status
  sheet.setColumnWidth(10, 300); // Health Note
  sheet.setFrozenRows(1);
  
  Logger.log('DMARC_Health tab initialized');
}

/**
 * Initialize Gmail labels
 * Creates all required labels with proper hierarchy
 */
function initializeGmailLabels() {
  Logger.log('Starting Gmail label initialization...');
  
  const config = getConfig();
  
  const labels = [
    config.labels_ticketed || 'Mythoria/Ticketed',
    config.labels_bounce || 'Mythoria/Bounce',
    config.labels_no_action || 'Mythoria/No-Action',
    config.labels_needs_review || 'Mythoria/Needs-Review',
    config.dmarc_label || 'Mythoria/DMARC'
  ];
  
  const created = [];
  const existing = [];
  
  labels.forEach(labelName => {
    try {
      let label = GmailApp.getUserLabelByName(labelName);
      
      if (!label) {
        label = GmailApp.createLabel(labelName);
        created.push(labelName);
        Logger.log(`Created label: ${labelName}`);
      } else {
        existing.push(labelName);
        Logger.log(`Label already exists: ${labelName}`);
      }
    } catch (error) {
      Logger.log(`ERROR creating label ${labelName}: ${error.message}`);
      logError('LABEL_INIT', `Failed to create label: ${labelName}`, { error: error.message });
    }
  });
  
  // Show results
  const ui = SpreadsheetApp.getUi();
  let message = 'Gmail Labels Initialized!\n\n';
  
  if (created.length > 0) {
    message += `Created (${created.length}):\n`;
    created.forEach(l => message += `  ✓ ${l}\n`);
    message += '\n';
  }
  
  if (existing.length > 0) {
    message += `Already existed (${existing.length}):\n`;
    existing.forEach(l => message += `  • ${l}\n`);
  }
  
  ui.alert('Gmail Labels', message, ui.ButtonSet.OK);
  
  Logger.log('Gmail label initialization complete!');
}
