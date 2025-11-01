/**
 * Google Sheets Service for data persistence
 */

const SheetsService = {
  /**
   * Get or create spreadsheet
   */
  getSpreadsheet: function() {
    if (!CONFIG.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID not configured');
    }
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  },
  
  /**
   * Get or create sheet
   */
  getSheet: function(sheetName) {
    const spreadsheet = this.getSpreadsheet();
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      this.initializeSheet(sheetName, sheet);
    }
    
    return sheet;
  },
  
  /**
   * Initialize sheet with headers
   */
  initializeSheet: function(sheetName, sheet) {
    let headers = [];
    
    switch(sheetName) {
      case CONFIG.SHEETS.PROCESSED_EMAILS:
        headers = ['Timestamp', 'Email ID', 'Thread ID', 'Subject', 'From', 'Date', 'Classification', 'Confidence', 'Summary', 'Labels'];
        break;
      case CONFIG.SHEETS.KNOWLEDGE_BASE:
        headers = ['Rule ID', 'Priority', 'Category', 'Keywords', 'Sender Pattern', 'Subject Pattern', 'Body Pattern', 'Action', 'Active'];
        break;
      case CONFIG.SHEETS.CLASSIFICATIONS:
        headers = ['Timestamp', 'Email ID', 'Category', 'Confidence', 'Method', 'Reasoning'];
        break;
      case CONFIG.SHEETS.SUMMARIES:
        headers = ['Timestamp', 'Email ID', 'Summary', 'Key Points', 'Sentiment'];
        break;
      case CONFIG.SHEETS.LOGS:
        headers = ['Timestamp', 'Level', 'Message', 'Data'];
        break;
    }
    
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  },
  
  /**
   * Append row to sheet
   */
  appendToSheet: function(sheetName, rowData) {
    try {
      const sheet = this.getSheet(sheetName);
      sheet.appendRow(rowData);
    } catch (e) {
      logMessage('ERROR', `Failed to append to sheet ${sheetName}`, { error: e.message });
      throw e;
    }
  },
  
  /**
   * Check if email already processed
   */
  isEmailProcessed: function(emailId) {
    try {
      const sheet = this.getSheet(CONFIG.SHEETS.PROCESSED_EMAILS);
      const data = sheet.getDataRange().getValues();
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === emailId) { // Email ID is in column 2
          return true;
        }
      }
      return false;
    } catch (e) {
      logMessage('WARN', 'Failed to check if email processed', { error: e.message });
      return false;
    }
  },
  
  /**
   * Save processed email
   */
  saveProcessedEmail: function(emailData) {
    this.appendToSheet(CONFIG.SHEETS.PROCESSED_EMAILS, [
      new Date(),
      emailData.id,
      emailData.threadId,
      emailData.subject,
      emailData.from,
      emailData.date,
      emailData.classification,
      emailData.confidence,
      emailData.summary,
      emailData.labels.join(', ')
    ]);
  },
  
  /**
   * Get knowledge base rules
   */
  getKnowledgeBaseRules: function() {
    try {
      const sheet = this.getSheet(CONFIG.SHEETS.KNOWLEDGE_BASE);
      const data = sheet.getDataRange().getValues();
      const rules = [];
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[8] === true || row[8] === 'TRUE' || row[8] === 'true') { // Active column
          rules.push({
            id: row[0],
            priority: row[1] || 0,
            category: row[2],
            keywords: row[3] ? row[3].toString().split(',').map(k => k.trim().toLowerCase()) : [],
            senderPattern: row[4],
            subjectPattern: row[5],
            bodyPattern: row[6],
            action: row[7]
          });
        }
      }
      
      // Sort by priority (higher first)
      rules.sort((a, b) => b.priority - a.priority);
      
      return rules;
    } catch (e) {
      logMessage('ERROR', 'Failed to get knowledge base rules', { error: e.message });
      return [];
    }
  },
  
  /**
   * Save classification result
   */
  saveClassification: function(emailId, category, confidence, method, reasoning) {
    this.appendToSheet(CONFIG.SHEETS.CLASSIFICATIONS, [
      new Date(),
      emailId,
      category,
      confidence,
      method,
      reasoning || ''
    ]);
  },
  
  /**
   * Save summary
   */
  saveSummary: function(emailId, summary, keyPoints, sentiment) {
    this.appendToSheet(CONFIG.SHEETS.SUMMARIES, [
      new Date(),
      emailId,
      summary,
      keyPoints || '',
      sentiment || ''
    ]);
  },
  
  /**
   * Initialize all sheets
   */
  initializeAllSheets: function() {
    const sheets = [
      CONFIG.SHEETS.PROCESSED_EMAILS,
      CONFIG.SHEETS.KNOWLEDGE_BASE,
      CONFIG.SHEETS.CLASSIFICATIONS,
      CONFIG.SHEETS.SUMMARIES,
      CONFIG.SHEETS.LOGS
    ];
    
    sheets.forEach(sheetName => {
      this.getSheet(sheetName);
    });
    
    logMessage('INFO', 'All sheets initialized successfully');
  }
};
