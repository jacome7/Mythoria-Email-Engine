/**
 * Mythoria Email Engine - Main Processor
 * 
 * Orchestrates the email processing pipeline
 */

/**
 * Main entry point - Process emails
 * Called by time-driven trigger or manually
 * 
 * @returns {Object} Run metrics
 */
function processMessages() {
  const startTime = new Date();
  const metrics = {
    processed: 0,
    ticketed: 0,
    bounced: 0,
    skipped: 0,
    drafted: 0,
    warnings: 0,
    errors: 0,
    duration: 0,
    status: 'completed'
  };
  
  try {
    Logger.log('=== Email Engine Starting ===');
    
    // Pre-flight checks
    if (!shouldRun()) {
      metrics.status = 'skipped';
      metrics.warnings++;
      logRun(metrics);
      Logger.log('=== Email Engine Skipped (Pre-flight checks failed) ===');
      return metrics;
    }
    
    // Get batch size from config
    const batchSize = getConfigNumber('batch_size', 20);
    const dryRun = getConfigBoolean('dry_run', false);
    
    if (dryRun) {
      Logger.log('⚠️ DRY RUN MODE - No cache marking or actions will be taken');
    }
    
    // Fetch unread threads
    const threads = fetchUnreadThreads(batchSize);
    
    if (threads.length === 0) {
      Logger.log('No threads to process');
      metrics.status = 'completed';
      logRun(metrics);
      Logger.log('=== Email Engine Completed (No work) ===');
      return metrics;
    }
    
    Logger.log(`Processing ${threads.length} thread(s)...`);
    
    // Process each thread
    for (let i = 0; i < threads.length; i++) {
      try {
        const result = processThread(threads[i], dryRun);
        
        if (result.processed) {
          metrics.processed++;
        }
        if (result.bounced) {
          metrics.bounced++;
        }
        if (result.skipped) {
          metrics.skipped++;
        }
        if (result.error) {
          metrics.errors++;
        }
      } catch (e) {
        Logger.log(`Error processing thread ${i}: ${e.message}`);
        logError('PROCESS_THREAD', `Failed to process thread`, { 
          index: i,
          error: e.message,
          stack: e.stack
        });
        metrics.errors++;
      }
    }
    
    // Process DMARC reports (integrated into same run)
    try {
      Logger.log('--- Processing DMARC Reports ---');
      const dmarcMetrics = processDmarcReports();
      Logger.log(`DMARC: ${dmarcMetrics.processed} processed, ${dmarcMetrics.health_rows_updated} health rows updated`);
    } catch (e) {
      Logger.log(`Error in DMARC processing: ${e.message}`);
      metrics.warnings++;
    }

    // Calculate duration after all work is finished
    const endTime = new Date();
    metrics.duration = Math.round((endTime - startTime) / 1000); // seconds
    
    // Log run metrics
    logRun(metrics);
    
    Logger.log(`=== Email Engine Completed: ${metrics.processed} processed, ${metrics.skipped} skipped, ${metrics.errors} errors in ${metrics.duration}s ===`);
    
    return metrics;
    
  } catch (e) {
    Logger.log(`Fatal error in processMessages: ${e.message}`);
    logError('PROCESS_MESSAGES', 'Fatal error in main processor', { 
      error: e.message,
      stack: e.stack
    });
    
    metrics.errors++;
    metrics.status = 'error';
    
    const endTime = new Date();
    metrics.duration = Math.round((endTime - startTime) / 1000);
    
    logRun(metrics);
    
    return metrics;
  }
}

/**
 * Check if the engine should run
 * @returns {boolean}
 */
function shouldRun() {
  // Check if enabled
  const enabled = getConfigBoolean('enabled', true);
  if (!enabled) {
    Logger.log('Engine is disabled (enabled=false)');
    return false;
  }
  
  // Check run window
  if (!isWithinRunWindow()) {
    Logger.log('Outside configured run window');
    return false;
  }
  
  Logger.log('✓ Pre-flight checks passed');
  return true;
}

/**
 * Process a single thread
 * @param {GoogleAppsScript.Gmail.GmailThread} thread 
 * @param {boolean} dryRun 
 * @returns {Object} Processing result
 */
function processThread(thread, dryRun) {
  const result = {
    processed: false,
    skipped: false,
    bounced: false,
    error: false
  };
  
  try {
    // Extract metadata
    const metadata = extractThreadMetadata(thread);
    
    if (!metadata) {
      Logger.log('Failed to extract thread metadata');
      result.error = true;
      return result;
    }
    
    Logger.log(`Thread ${metadata.threadId}: ${metadata.subject}`);
    
    // Check cache - skip if already processed
    if (isProcessed(metadata.threadId)) {
      Logger.log(`  ↳ SKIPPED (already in cache)`);
      result.skipped = true;
      return result;
    }
    
    // Check message age
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    
    if (isMessageTooOld(lastMessage)) {
      Logger.log(`  ↳ SKIPPED (too old)`);
      result.skipped = true;
      
      // Still mark as processed in dry run to see the flow
      if (!dryRun) {
        markProcessed(metadata.threadId);
      }
      
      return result;
    }
    
    // ==================================================
    // PHASE 3: BOUNCE DETECTION (FIRST IN PIPELINE)
    // ==================================================
    // Check for bounce BEFORE KB rules (as per AGENTS.md)
    if (isBounceEmail(thread, metadata)) {
      Logger.log(`  ↳ 🔴 BOUNCE DETECTED`);
      
      // Parse bounce details
      const bounceDetails = parseBounceDetails(metadata);
      
      // Handle bounce (API call, label, archive)
      const bounceResult = handleBounce(thread, metadata, bounceDetails);
      
      // Log to Messages_Log
      logMessage({
        threadId: metadata.threadId,
        messageId: metadata.lastMessageId,
        from: metadata.from,
        subject: metadata.subject,
        category: 'bounce',
        priority: bounceDetails.bounceType === 'hard' ? 'P1' : 'P2',
        action: 'bounce',
        source: 'bounce_handler',
        ticketId: '',
        draftId: '',
        labels: metadata.labels.join(', ')
      });
      
      result.processed = true;
      result.bounced = true;
      
      // Mark as processed in cache (unless dry run)
      if (!dryRun) {
        markProcessed(metadata.threadId);
      }
      
      return result;
    }
    
    // ==================================================
    // PHASE 2: Regular message processing (placeholder)
    // ==================================================
    // TODO: Phase 4 will add KB rules here
    // TODO: Phase 5 will add LLM classification here
    // TODO: Phase 6 will add ticket creation here
    // TODO: Phase 7 will add draft generation here
    
    // Notify Press Releases API of a potential reply
    try {
      const pressApiBase = getScriptProperty('press_api_base');
      const pressApiToken = getScriptProperty('press_api_token');
      if (pressApiBase && pressApiToken && metadata.from) {
        // Extract clean email from Name <email>
        const emailMatch = metadata.from.match(/<([^>]+)>/);
        const cleanEmail = emailMatch ? emailMatch[1] : metadata.from.trim();
        
        const payload = {
          event: 'reply',
          email: cleanEmail,
          details: metadata.subject,
          threadUrl: 'https://mail.google.com/mail/u/0/#inbox/' + metadata.threadId
        };
        UrlFetchApp.fetch(pressApiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          payload: JSON.stringify({ ...payload, token: pressApiToken }),
          muteHttpExceptions: true
        });
        Logger.log('Notified Press API of potential reply from: ' + cleanEmail);
      }
    } catch (e) {
      Logger.log('Failed to notify Press API of reply: ' + e.message);
    }

    // Phase 2: Just log basic metadata
    logMessage({
      threadId: metadata.threadId,
      messageId: metadata.lastMessageId,
      from: metadata.from,
      subject: metadata.subject,
      category: '',
      priority: '',
      action: 'fetched',
      source: 'phase2',
      ticketId: '',
      draftId: '',
      labels: metadata.labels.join(', ')
    });
    
    Logger.log(`  ↳ PROCESSED`);
    result.processed = true;
    
    // Mark as processed in cache (unless dry run)
    if (!dryRun) {
      markProcessed(metadata.threadId);
    } else {
      Logger.log(`  ↳ [DRY RUN] Would mark as processed`);
    }
    
    return result;
    
  } catch (e) {
    Logger.log(`Error in processThread: ${e.message}`);
    logError('PROCESS_THREAD', 'Failed to process thread', { 
      threadId: thread ? thread.getId() : 'unknown',
      error: e.message 
    });
    result.error = true;
    return result;
  }
}
