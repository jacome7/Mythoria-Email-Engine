/**
 * Mythoria Email Engine - DMARC Processor
 * 
 * Handles DMARC aggregate report ingestion and health tracking
 * Processes messages labeled with DMARC label, extracts XML reports,
 * aggregates metrics, and updates DMARC_Health sheet
 */

/**
 * Main entry point for DMARC report processing
 * Called by runEmailEngine as part of main trigger
 * 
 * @returns {Object} Processing metrics
 */
function processDmarcReports() {
  const startTime = new Date();
  const metrics = {
    processed: 0,
    skipped: 0,
    errors: 0,
    health_rows_updated: 0
  };
  
  try {
    // Check if DMARC processing is enabled
    if (!getConfigBoolean('dmarc_enabled', true)) {
      Logger.log('DMARC processing is disabled');
      return metrics;
    }
    
    const dryRun = getConfigBoolean('dry_run', false);
    const batchSize = getConfigNumber('dmarc_batch_size', 50);
    
    Logger.log('=== DMARC Processor Starting ===');
    
    // Fetch DMARC report messages
    const messages = fetchDmarcMessages(batchSize);
    
    if (messages.length === 0) {
      Logger.log('No DMARC reports to process');
      return metrics;
    }
    
    Logger.log(`Processing ${messages.length} DMARC report message(s)...`);
    
    // Process each message
    for (let i = 0; i < messages.length; i++) {
      try {
        const result = processDmarcMessage(messages[i], dryRun);
        
        if (result.processed) {
          metrics.processed++;
        }
        if (result.skipped) {
          metrics.skipped++;
        }
        if (result.error) {
          metrics.errors++;
        }
        if (result.health_updated) {
          metrics.health_rows_updated++;
        }
        
      } catch (e) {
        Logger.log(`Error processing DMARC message ${i}: ${e.message}`);
        logError('DMARC_PROCESS_MESSAGE', 'Failed to process DMARC message', {
          index: i,
          error: e.message,
          stack: e.stack
        });
        metrics.errors++;
      }
    }
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    Logger.log(`=== DMARC Processor Completed: ${metrics.processed} processed, ${metrics.health_rows_updated} health rows updated, ${metrics.errors} errors in ${duration}s ===`);
    
    return metrics;
    
  } catch (e) {
    Logger.log(`Fatal error in processDmarcReports: ${e.message}`);
    logError('DMARC_PROCESS', 'Fatal error in DMARC processor', {
      error: e.message,
      stack: e.stack
    });
    metrics.errors++;
    return metrics;
  }
}

/**
 * Fetch messages with DMARC label
 * @param {number} maxMessages 
 * @returns {GoogleAppsScript.Gmail.GmailMessage[]}
 */
function fetchDmarcMessages(maxMessages) {
  try {
    const dmarcLabel = getConfigValue('dmarc_label', 'Mythoria/DMARC');
    
    // Search for unread messages with DMARC label
    const query = `label:${dmarcLabel} is:unread`;
    Logger.log(`Fetching DMARC messages with query: "${query}"`);
    
    const threads = GmailApp.search(query, 0, maxMessages);
    
    // Extract all messages from threads
    const messages = [];
    for (let i = 0; i < threads.length; i++) {
      const threadMessages = threads[i].getMessages();
      for (let j = 0; j < threadMessages.length; j++) {
        if (threadMessages[j].isUnread()) {
          messages.push(threadMessages[j]);
        }
      }
    }
    
    Logger.log(`Fetched ${messages.length} DMARC message(s) from ${threads.length} thread(s)`);
    return messages;
    
  } catch (e) {
    Logger.log(`Error fetching DMARC messages: ${e.message}`);
    logError('DMARC_FETCH', 'Failed to fetch DMARC messages', {
      error: e.message
    });
    return [];
  }
}

/**
 * Process a single DMARC report message
 * @param {GoogleAppsScript.Gmail.GmailMessage} message 
 * @param {boolean} dryRun 
 * @returns {Object} Processing result
 */
function processDmarcMessage(message, dryRun) {
  const result = {
    processed: false,
    skipped: false,
    error: false,
    health_updated: false
  };
  
  try {
    const messageId = message.getId();
    
    // Check cache for idempotency
    const cacheKey = `dmarc:${messageId}`;
    if (isProcessedDmarc(cacheKey)) {
      Logger.log(`Skipping already processed DMARC message: ${messageId}`);
      result.skipped = true;
      return result;
    }
    
    Logger.log(`Processing DMARC message: ${messageId}`);
    
    // Extract and parse attachments
    const reports = extractAndParseAttachments(message);
    
    if (reports.length === 0) {
      Logger.log('No valid DMARC reports found in attachments');
      logError('DMARC_NO_REPORTS', 'No valid DMARC reports in message', {
        messageId: messageId,
        subject: message.getSubject()
      });
      result.error = true;
      
      // Mark as read and processed to avoid reprocessing
      if (!dryRun) {
        message.markRead();
        markProcessedDmarc(cacheKey);
      }
      
      return result;
    }
    
    Logger.log(`Found ${reports.length} valid report(s) in message`);
    
    // Log DMARC message to Messages_Log
    logDmarcMessage({
      threadId: message.getThread().getId(),
      messageId: messageId,
      from: message.getFrom(),
      subject: message.getSubject(),
      reportsCount: reports.length,
      domains: reports.map(r => r.metadata.domain).join(', ')
    });
    
    // Process each report and update health sheet
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      if (!dryRun) {
        const updated = updateDmarcHealth(report);
        if (updated) {
          result.health_updated = true;
        }
      } else {
        Logger.log(`[DRY RUN] Would update DMARC_Health for domain: ${report.metadata.domain}, date: ${formatDate(report.metadata.end_date)}`);
      }
    }
    
    // Mark as processed and delete message
    if (!dryRun) {
      message.markRead();
      markProcessedDmarc(cacheKey);
      
      // Delete message if configured
      if (getConfigBoolean('dmarc_delete_after_processing', true)) {
        message.moveToTrash();
        Logger.log(`Deleted DMARC message: ${messageId}`);
      }
    } else {
      Logger.log(`[DRY RUN] Would mark as read and delete DMARC message: ${messageId}`);
    }
    
    result.processed = true;
    return result;
    
  } catch (e) {
    Logger.log(`Error in processDmarcMessage: ${e.message}`);
    logError('DMARC_PROCESS_MESSAGE', 'Error processing DMARC message', {
      messageId: message.getId(),
      error: e.message,
      stack: e.stack
    });
    result.error = true;
    return result;
  }
}

/**
 * Extract and parse DMARC report attachments
 * Handles XML, .xml.gz, and .zip files
 * @param {GoogleAppsScript.Gmail.GmailMessage} message 
 * @returns {Array<Object>} Parsed reports
 */
function extractAndParseAttachments(message) {
  const reports = [];
  
  try {
    const attachments = message.getAttachments();
    
    Logger.log(`Found ${attachments.length} attachment(s)`);
    
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const fileName = attachment.getName();
      const contentType = attachment.getContentType();
      
      Logger.log(`Processing attachment: ${fileName} (${contentType})`);
      
      let xmlContent = null;
      
      // Handle different file types
      if (fileName.endsWith('.xml')) {
        // Plain XML
        xmlContent = attachment.getDataAsString();
        
      } else if (fileName.endsWith('.gz') || fileName.endsWith('.gzip')) {
        // Gzip compressed
        try {
          // Try using the attachment blob directly first
          try {
            const uncompressed = Utilities.ungzip(attachment);
            xmlContent = uncompressed.getDataAsString();
            Logger.log('Successfully decompressed gzip using attachment directly');
          } catch (e1) {
            // Fallback: try converting to blob with explicit type
            Logger.log(`Direct ungzip failed: ${e1.message}, trying with explicit blob...`);
            const compressed = attachment.getBytes();
            const compressedBlob = Utilities.newBlob(compressed, 'application/x-gzip', fileName);
            const uncompressed = Utilities.ungzip(compressedBlob);
            xmlContent = uncompressed.getDataAsString();
            Logger.log('Successfully decompressed gzip using explicit blob');
          }
        } catch (e) {
          Logger.log(`Error decompressing gzip: ${e.message}`);
          Logger.log(`  Attachment size: ${attachment.getSize()} bytes`);
          Logger.log(`  Content type: ${contentType}`);
        }
        
      } else if (fileName.endsWith('.zip')) {
        // Zip archive
        try {
          // Try using attachment directly first
          try {
            const uncompressed = Utilities.unzip(attachment);
            if (uncompressed.length > 0) {
              xmlContent = uncompressed[0].getDataAsString();
              Logger.log('Successfully extracted zip using attachment directly');
            }
          } catch (e1) {
            // Fallback: try converting to blob
            Logger.log(`Direct unzip failed: ${e1.message}, trying with explicit blob...`);
            const compressed = attachment.getBytes();
            const compressedBlob = Utilities.newBlob(compressed, 'application/zip', fileName);
            const uncompressed = Utilities.unzip(compressedBlob);
            if (uncompressed.length > 0) {
              xmlContent = uncompressed[0].getDataAsString();
              Logger.log('Successfully extracted zip using explicit blob');
            }
          }
        } catch (e) {
          Logger.log(`Error extracting zip: ${e.message}`);
          Logger.log(`  Attachment size: ${attachment.getSize()} bytes`);
          Logger.log(`  Content type: ${contentType}`);
        }
        
      } else {
        Logger.log(`Skipping unsupported file type: ${fileName}`);
        continue;
      }
      
      // Parse XML
      if (xmlContent) {
        const report = parseDmarcReportXml(xmlContent);
        if (report) {
          reports.push(report);
          Logger.log(`Successfully parsed report: ${report.metadata.report_id}`);
        }
      }
    }
    
  } catch (e) {
    Logger.log(`Error extracting attachments: ${e.message}`);
    logError('DMARC_EXTRACT', 'Failed to extract DMARC attachments', {
      error: e.message
    });
  }
  
  return reports;
}

/**
 * Update DMARC_Health sheet with report data
 * Overwrites existing row for same date×domain (latest wins)
 * @param {Object} report - Parsed report
 * @returns {boolean} Success status
 */
function updateDmarcHealth(report) {
  try {
    const sheet = getOrCreateSheet('DMARC_Health');
    
    const domain = report.metadata.domain;
    const date = formatDate(report.metadata.end_date);
    const metrics = report.metrics;
    const health = calculateHealthStatus(metrics);
    
    // Check if row already exists for this date×domain
    const existingRowIndex = findDmarcHealthRow(sheet, date, domain);
    
    const row = [
      date,
      domain,
      metrics.total_msgs,
      metrics.dmarc_pass_rate,
      metrics.quarantine_count,
      metrics.reject_count,
      metrics.spf_aligned_pass_rate,
      metrics.dkim_aligned_pass_rate,
      health.status,
      health.note
    ];
    
    if (existingRowIndex > 0) {
      // Overwrite existing row (latest wins)
      sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row]);
      Logger.log(`Updated existing DMARC_Health row ${existingRowIndex} for ${date} × ${domain}`);
    } else {
      // Append new row
      sheet.appendRow(row);
      Logger.log(`Appended new DMARC_Health row for ${date} × ${domain}`);
    }
    
    return true;
    
  } catch (e) {
    Logger.log(`Error updating DMARC_Health: ${e.message}`);
    logError('DMARC_UPDATE_HEALTH', 'Failed to update DMARC_Health sheet', {
      domain: report.metadata.domain,
      date: formatDate(report.metadata.end_date),
      error: e.message
    });
    return false;
  }
}

/**
 * Find existing row in DMARC_Health sheet for date×domain
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
 * @param {string} date 
 * @param {string} domain 
 * @returns {number} Row index (1-based) or 0 if not found
 */
function findDmarcHealthRow(sheet, date, domain) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return 0; // No data rows
    }
    
    // Get all date and domain columns
    const dateValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const domainValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    
    // Search for matching row
    for (let i = 0; i < dateValues.length; i++) {
      if (dateValues[i][0] === date && domainValues[i][0] === domain) {
        return i + 2; // +2 because: array is 0-based, and we skip header row
      }
    }
    
    return 0; // Not found
    
  } catch (e) {
    Logger.log(`Error finding DMARC health row: ${e.message}`);
    return 0;
  }
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  const tz = getConfigValue('tz', 'Europe/Lisbon');
  return Utilities.formatDate(date, tz, 'yyyy-MM-dd');
}

/**
 * Check if DMARC message is already processed (cache)
 * @param {string} cacheKey 
 * @returns {boolean}
 */
function isProcessedDmarc(cacheKey) {
  const cache = getCacheService();
  return cache.get(cacheKey) !== null;
}

/**
 * Mark DMARC message as processed (cache)
 * @param {string} cacheKey 
 * @returns {boolean}
 */
function markProcessedDmarc(cacheKey) {
  try {
    const cache = getCacheService();
    const ttl = getConfigNumber('cache_ttl', 21600); // 6 hours
    cache.put(cacheKey, new Date().toISOString(), ttl);
    return true;
  } catch (e) {
    Logger.log(`Error marking DMARC as processed: ${e.message}`);
    return false;
  }
}

/**
 * Log a detected DMARC message to Messages_Log with DMARC category
 * @param {Object} dmarcMessage - DMARC message details
 * @param {string} dmarcMessage.threadId
 * @param {string} dmarcMessage.messageId
 * @param {string} dmarcMessage.from
 * @param {string} dmarcMessage.subject
 * @param {number} dmarcMessage.reportsCount - Number of reports found
 * @param {string} dmarcMessage.domains - Comma-separated list of domains
 */
function logDmarcMessage(dmarcMessage) {
  try {
    logMessage({
      threadId: dmarcMessage.threadId || '',
      messageId: dmarcMessage.messageId || '',
      from: dmarcMessage.from || '',
      subject: dmarcMessage.subject || '',
      category: 'DMARC',
      priority: 'P3',
      action: 'dmarc_report',
      source: 'dmarc_parser',
      ticketId: '',
      draftId: '',
      labels: dmarcMessage.domains || ''
    });
    Logger.log(`Logged DMARC message to Messages_Log: ${dmarcMessage.reportsCount} report(s) from ${dmarcMessage.domains}`);
  } catch (e) {
    Logger.log(`Error logging DMARC message: ${e.message}`);
    logError('DMARC_LOG_MESSAGE', 'Failed to log DMARC message', {
      messageId: dmarcMessage.messageId,
      error: e.message
    });
  }
}
