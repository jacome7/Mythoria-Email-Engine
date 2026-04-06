/**
 * Mythoria Email Engine - Logger
 * 
 * Functions to write logs to various Sheet tabs
 */

/**
 * Log a run execution to Runs_Log
 * @param {Object} metrics - Run metrics
 * @param {number} metrics.duration - Duration in seconds
 * @param {number} metrics.processed - Messages processed
 * @param {number} metrics.ticketed - Tickets created
 * @param {number} metrics.bounced - Bounces detected
 * @param {number} metrics.skipped - Messages skipped
 * @param {number} metrics.drafted - Drafts created
 * @param {number} metrics.warnings - Warning count
 * @param {number} metrics.errors - Error count
 * @param {string} metrics.status - Overall status
 */
function logRun(metrics) {
  const sheet = getOrCreateSheet('Runs_Log');
  
  const row = [
    formatTimestamp(new Date()),
    metrics.duration || 0,
    metrics.processed || 0,
    metrics.ticketed || 0,
    metrics.bounced || 0,
    metrics.skipped || 0,
    metrics.drafted || 0,
    metrics.warnings || 0,
    metrics.errors || 0,
    metrics.status || 'completed'
  ];
  
  sheet.appendRow(row);
  Logger.log(`Run logged: ${metrics.processed} processed, ${metrics.errors} errors`);
}

/**
 * Log a processed message to Messages_Log
 * @param {Object} message - Message details
 * @param {string} message.threadId
 * @param {string} message.messageId
 * @param {string} message.from
 * @param {string} message.subject
 * @param {string} message.category
 * @param {string} message.priority
 * @param {string} message.action
 * @param {string} message.source - Rule ID or 'LLM' or 'KB'
 * @param {string} message.ticketId
 * @param {string} message.draftId
 * @param {string} message.labels
 */
function logMessage(message) {
  const sheet = getOrCreateSheet('Messages_Log');
  
  const row = [
    formatTimestamp(new Date()),
    message.threadId || '',
    message.messageId || '',
    message.from || '',
    truncate(message.subject || '', 100),
    message.category || '',
    message.priority || '',
    message.action || '',
    message.source || '',
    message.ticketId || '',
    message.draftId || '',
    message.labels || ''
  ];
  
  sheet.appendRow(row);
}

/**
 * Log a bounce to Bounces tab
 * @param {Object} bounce - Bounce details
 * @param {string} bounce.threadId
 * @param {string} bounce.messageId
 * @param {string} bounce.recipient
 * @param {string} bounce.statusCode
 * @param {string} bounce.bounceType - 'hard' or 'soft'
 * @param {string} bounce.reason
 * @param {string} bounce.apiResponse
 * @param {string} bounce.status
 */
function logBounce(bounce) {
  const sheet = getOrCreateSheet('Bounces');
  
  const row = [
    formatTimestamp(new Date()),
    bounce.threadId || '',
    bounce.messageId || '',
    bounce.recipient || '',
    bounce.statusCode || '',
    bounce.bounceType || '',
    truncate(bounce.reason || '', 200),
    truncate(bounce.apiResponse || '', 300),
    bounce.status || 'logged'
  ];
  
  sheet.appendRow(row);
  Logger.log(`Bounce logged: ${bounce.recipient} (${bounce.statusCode})`);
}

/**
 * Log a ticket creation/update to Tickets tab
 * @param {Object} ticket - Ticket details
 * @param {string} ticket.threadId
 * @param {string} ticket.ticketId
 * @param {string} ticket.category
 * @param {string} ticket.priority
 * @param {string} ticket.status
 */
function logTicket(ticket) {
  const sheet = getOrCreateSheet('Tickets');
  const timestamp = formatTimestamp(new Date());
  
  // Check if ticket already exists (by threadId)
  const data = sheet.getDataRange().getValues();
  let existingRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ticket.threadId) {
      existingRow = i + 1;
      break;
    }
  }
  
  if (existingRow > 0) {
    // Update existing
    sheet.getRange(existingRow, 2).setValue(ticket.ticketId || '');
    sheet.getRange(existingRow, 3).setValue(ticket.category || '');
    sheet.getRange(existingRow, 4).setValue(ticket.priority || '');
    sheet.getRange(existingRow, 5).setValue(ticket.status || '');
    sheet.getRange(existingRow, 7).setValue(timestamp);
    Logger.log(`Ticket updated: ${ticket.ticketId} for thread ${ticket.threadId}`);
  } else {
    // Insert new
    const row = [
      ticket.threadId || '',
      ticket.ticketId || '',
      ticket.category || '',
      ticket.priority || '',
      ticket.status || 'open',
      timestamp,
      timestamp
    ];
    sheet.appendRow(row);
    Logger.log(`Ticket logged: ${ticket.ticketId} for thread ${ticket.threadId}`);
  }
}

/**
 * Log an error to Errors tab
 * @param {string} context - Where the error occurred
 * @param {string} message - Error message
 * @param {Object} details - Additional details
 * @param {number} retryCount - Number of retries attempted
 */
function logError(context, message, details = {}, retryCount = 0) {
  const sheet = getOrCreateSheet('Errors');
  
  const row = [
    formatTimestamp(new Date()),
    context || 'UNKNOWN',
    truncate(message || '', 300),
    truncate(JSON.stringify(details), 500),
    retryCount,
    'false'
  ];
  
  sheet.appendRow(row);
  Logger.log(`ERROR [${context}]: ${message}`);
}

/**
 * Get ticket ID for a given thread ID
 * @param {string} threadId 
 * @returns {string|null}
 */
function getTicketIdByThreadId(threadId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tickets');
  
  if (!sheet) {
    return null;
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === threadId) {
      return data[i][1]; // Return ticket ID
    }
  }
  
  return null;
}

/**
 * Truncate a string to a maximum length
 * @param {string} str 
 * @param {number} maxLength 
 * @returns {string}
 */
function truncate(str, maxLength) {
  if (!str) {
    return '';
  }
  
  const text = String(str);
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Clear all log data (use with caution!)
 * @param {string} tabName - Name of the tab to clear (or 'all')
 */
function clearLogs(tabName = 'all') {
  const tabs = tabName === 'all' 
    ? ['Runs_Log', 'Messages_Log', 'Bounces', 'Tickets', 'Errors']
    : [tabName];
  
  tabs.forEach(name => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
        Logger.log(`Cleared ${name} (${lastRow - 1} rows)`);
      }
    }
  });
}
