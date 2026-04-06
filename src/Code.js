/**
 * Mythoria Email Engine - Main Entry Point
 * 
 * Core utilities and helper functions used throughout the application.
 */

var REQUIRED_SCRIPT_PROPERTIES = [
  'openai_api_key',
  'mythoria_api_base',
  'mythoria_api_token',
  'press_api_base',
  'press_api_token'
];

/**
 * Get the active spreadsheet (bound to this script)
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get a sheet by name, creating it if it doesn't exist
 * @param {string} sheetName 
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  return sheet;
}

/**
 * Format a timestamp in ISO 8601 format
 * @param {Date} date 
 * @returns {string}
 */
function formatTimestamp(date) {
  if (!date) {
    date = new Date();
  }
  return Utilities.formatDate(date, getConfigValue('tz') || 'Europe/Lisbon', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString 
 * @returns {Object|null}
 */
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    logError('JSON_PARSE', `Failed to parse JSON: ${e.message}`, { raw: jsonString });
    return null;
  }
}

/**
 * Get Script Properties (secure storage)
 * @returns {GoogleAppsScript.Properties.Properties}
 */
function getScriptProperties() {
  return PropertiesService.getScriptProperties();
}

/**
 * Get a Script Property value
 * @param {string} key 
 * @returns {string|null}
 */
function getScriptProperty(key) {
  return getScriptProperties().getProperty(key);
}

/**
 * Return required Script Properties with their current status.
 * @returns {Array<Object>}
 */
function getScriptPropertyStatus() {
  return REQUIRED_SCRIPT_PROPERTIES.map(key => ({
    key: key,
    isSet: !!getScriptProperty(key)
  }));
}

/**
 * Get any missing Script Properties.
 * @returns {string[]}
 */
function getMissingScriptProperties() {
  return getScriptPropertyStatus()
    .filter(item => !item.isSet)
    .map(item => item.key);
}

/**
 * Show the secure setup flow for Script Properties.
 */
function showScriptPropertiesSetupGuide() {
  const ui = SpreadsheetApp.getUi();
  const missing = getMissingScriptProperties();
  const missingSummary = missing.length > 0
    ? `Missing keys: ${missing.join(', ')}\n\n`
    : 'All required keys are configured.\n\n';

  ui.alert(
    'Script Properties Setup',
    missingSummary +
      'Store secrets in Apps Script Project Settings, not in source code.\n\n' +
      'Required keys:\n' +
      '  openai_api_key\n' +
      '  mythoria_api_base\n' +
      '  mythoria_api_token\n\n' +
      'Path:\n' +
      '  Apps Script editor -> Project Settings -> Script Properties',
    ui.ButtonSet.OK
  );
}

/**
 * Legacy helper kept only to prevent unsafe workflows.
 * Secrets must be configured in Apps Script Project Settings.
 */
function setScriptProperties() {
  throw new Error(
    'Do not place live secrets in source code. Set openai_api_key, mythoria_api_base, and mythoria_api_token in Project Settings -> Script Properties.'
  );
}

/**
 * Try to acquire a script-level lock before a run starts.
 * @param {number} timeoutMs
 * @returns {GoogleAppsScript.Lock.Lock|null}
 */
function acquireRunLock(timeoutMs) {
  const lock = LockService.getScriptLock();
  const waitMs = timeoutMs || 5000;

  return lock.tryLock(waitMs) ? lock : null;
}

/**
 * Release the run lock without surfacing secondary failures.
 * @param {GoogleAppsScript.Lock.Lock|null} lock
 */
function releaseRunLock(lock) {
  if (!lock) {
    return;
  }

  try {
    lock.releaseLock();
  } catch (error) {
    Logger.log(`Warning releasing run lock: ${error.message}`);
  }
}

/**
 * Main entry point for email processing
 * Called by time-driven trigger or manually
 */
function runEmailEngine() {
  let lock = null;

  try {
    Logger.log('runEmailEngine called');

    lock = acquireRunLock(getConfigNumber('lock_timeout_ms', 5000));
    if (!lock) {
      const metrics = {
        processed: 0,
        ticketed: 0,
        bounced: 0,
        skipped: 0,
        drafted: 0,
        warnings: 1,
        errors: 0,
        duration: 0,
        status: 'locked'
      };

      Logger.log('Skipping run because another execution already holds the script lock');
      logRun(metrics);
      return metrics;
    }

    const metrics = processMessages();
    Logger.log(`Engine completed: ${JSON.stringify(metrics)}`);
    return metrics;
  } catch (e) {
    Logger.log(`Fatal error in runEmailEngine: ${e.message}`);
    logError('RUN_ENGINE', 'Fatal error in main entry point', { 
      error: e.message,
      stack: e.stack
    });
    throw e;
  } finally {
    releaseRunLock(lock);
  }
}

/**
 * Main menu for manual operations
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('Mythoria Email Engine')
    .addItem('Run Email Engine (Manual)', 'runEmailEngineManual')
    .addItem('Clear Cache and Run', 'clearCacheAndRun')
    .addSeparator()
    .addItem('Initialize Sheet Tabs', 'initializeSheetTabs')
    .addItem('Initialize Gmail Labels', 'initializeGmailLabels')
    .addSeparator()
    .addSubMenu(ui.createMenu('Triggers')
      .addItem('Install Recommended Trigger', 'installRecommendedTrigger')
      .addItem('View Trigger Status', 'showTriggerStatus'))
    .addSubMenu(ui.createMenu('Cache')
      .addItem('Clear Cache (Force Reprocess)', 'clearCacheManual')
      .addItem('View Cache Stats', 'showCacheStats'))
    .addSubMenu(ui.createMenu('Debug')
      .addItem('Why Are Emails Skipped?', 'debugSkippedEmails')
      .addItem('Inspect Bounce Email Content', 'debugBounceContent'))
    .addSubMenu(ui.createMenu('Tests')
      .addItem('Validate Setup', 'testSetup')
      .addItem('Test Phase 2 (Fetch & Cache)', 'testPhase2')
      .addItem('Test Phase 3 (Bounce Handling)', 'testPhase3')
      .addItem('Test Bounce Detection (Manual)', 'testBounceDetectionManual'))
    .addSubMenu(ui.createMenu('Info')
      .addItem('View Config', 'showConfiguration')
      .addItem('View Script Property Setup', 'showScriptPropertiesSetupGuide')
      .addItem('View KB Summary', 'showKBSummary')
      .addItem('View Bounce Patterns', 'showBouncePatterns'))
    .addToUi();
}

/**
 * Run engine manually
 */
function runEmailEngineManual() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const metrics = runEmailEngine();
    const title = metrics.status === 'locked' ? 'Engine Skipped' : 'Engine Completed';
    const statusDetails = metrics.status === 'locked'
      ? 'Another run was already in progress, so this execution exited safely.\n'
      : '';

    ui.alert(
      title,
      statusDetails +
      `Processed: ${metrics.processed}\n` +
      `Bounced: ${metrics.bounced || 0}\n` +
      `Skipped: ${metrics.skipped}\n` +
      `Errors: ${metrics.errors}\n` +
      `Duration: ${metrics.duration}s\n` +
      `Status: ${metrics.status}`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert(
      '✗ Error',
      `Engine failed: ${e.message}\n\nCheck the Errors tab for details.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Clear cache AND run engine immediately (for testing)
 */
function clearCacheAndRun() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    Logger.log('Clearing cache...');
    clearProcessedCache();
    Logger.log('Cache cleared, running engine...');
    
    const metrics = runEmailEngine();
    const title = metrics.status === 'locked'
      ? 'Cache Cleared - Engine Skipped'
      : 'Cache Cleared - Engine Run';
    const prefix = metrics.status === 'locked'
      ? 'Cache was cleared, but the engine skipped because another run still held the execution lock.\n\n'
      : 'Cache was cleared and engine ran successfully:\n\n';
    
    ui.alert(
      title,
      prefix +
      `Processed: ${metrics.processed}\n` +
      `Bounced: ${metrics.bounced || 0}\n` +
      `Skipped: ${metrics.skipped}\n` +
      `Errors: ${metrics.errors}\n` +
      `Duration: ${metrics.duration}s\n` +
      `Status: ${metrics.status}\n\n` +
      `Check Messages_Log and Bounces tabs for details.`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert(
      '✗ Error',
      `Failed: ${e.message}\n\nCheck the Errors tab for details.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Show cache statistics
 */
function showCacheStats() {
  const stats = getCacheStats();
  const ui = SpreadsheetApp.getUi();
  
  let message = `📊 Cache Statistics:\n\n`;
  
  if (stats.error) {
    message += `⚠️ Error: ${stats.error}\n\n`;
  }
  
  message += `Cached Threads: ${stats.cachedThreads || 0}\n`;
  message += `TTL: ${stats.ttl} seconds\n`;
  message += `    (${stats.ttlMinutes} minutes / ${stats.ttlHours} hours)\n\n`;
  
  if (stats.cachedThreads > 0) {
    message += `${stats.cachedThreads} thread(s) marked as processed.\n`;
    message += `They will not be reprocessed until:\n`;
    message += `  • Cache is manually cleared, OR\n`;
    message += `  • TTL expires (${stats.ttlHours} hours)\n\n`;
    message += `To reprocess: Menu → Cache → Clear Cache`;
  } else {
    message += `No threads in cache.\n`;
    message += `All inbox emails will be processed on next run.`;
  }
  
  ui.alert('Cache Statistics', message, ui.ButtonSet.OK);
}

/**
 * Clear cache manually (allows reprocessing)
 */
function clearCacheManual() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Clear Cache?',
    'This will allow all emails to be reprocessed.\n\n' +
    'Currently cached emails will be processed again on the next run.\n\n' +
    'Are you sure you want to clear the cache?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      clearProcessedCache();
      ui.alert(
        '✓ Cache Cleared',
        'The cache has been cleared successfully.\n\n' +
        'All emails will be reprocessed on the next run.\n\n' +
        'Note: Cache will also clear automatically after 6 hours.',
        ui.ButtonSet.OK
      );
      Logger.log('Cache cleared manually by user');
    } catch (error) {
      ui.alert(
        '✗ Error',
        `Failed to clear cache: ${error.message}`,
        ui.ButtonSet.OK
      );
    }
  } else {
    Logger.log('Cache clear cancelled by user');
  }
}

/**
 * Debug bounce email content to see why recipient extraction fails
 */
function debugBounceContent() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    Logger.log('=== Debug: Bounce Email Content ===');
    
    // Get the thread IDs from Bounces tab
    const bouncesSheet = getOrCreateSheet('Bounces');
    const data = bouncesSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      ui.alert('No Bounces Found', 'The Bounces tab is empty. Process some emails first.', ui.ButtonSet.OK);
      return;
    }
    
    // Get the most recent bounce thread ID (skip header row)
    const lastBounceRow = data[data.length - 1];
    const threadId = lastBounceRow[1]; // Column B = Thread ID
    
    if (!threadId || threadId === '') {
      ui.alert('Error', 'No thread ID found in last bounce entry.', ui.ButtonSet.OK);
      return;
    }
    
    Logger.log(`Analyzing bounce thread: ${threadId}`);
    
    // Get the Gmail thread
    const thread = GmailApp.getThreadById(threadId);
    if (!thread) {
      ui.alert('Error', `Thread ${threadId} not found in Gmail.`, ui.ButtonSet.OK);
      return;
    }
    
    // Get messages in thread
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    
    // Extract full details
    const from = lastMessage.getFrom();
    const subject = lastMessage.getSubject();
    const plainBody = lastMessage.getPlainBody();
    const rawContent = lastMessage.getRawContent();
    
    Logger.log('\n--- EMAIL HEADERS ---');
    Logger.log(`From: ${from}`);
    Logger.log(`Subject: ${subject}`);
    Logger.log(`Date: ${lastMessage.getDate()}`);
    
    Logger.log('\n--- PLAIN BODY (first 1000 chars) ---');
    Logger.log(plainBody.substring(0, 1000));
    
    Logger.log('\n--- RAW CONTENT (first 2000 chars) ---');
    Logger.log(rawContent.substring(0, 2000));
    
    // Try to extract recipient using our current logic
    const metadata = extractThreadMetadata(thread);
    if (metadata) {
      const bounceDetails = parseBounceDetails(metadata);
      
      Logger.log('\n--- EXTRACTED DETAILS ---');
      Logger.log(`Recipient: ${bounceDetails.recipient}`);
      Logger.log(`Status Code: ${bounceDetails.statusCode}`);
      Logger.log(`Bounce Type: ${bounceDetails.bounceType}`);
      Logger.log(`Reason: ${bounceDetails.reason}`);
    }
    
    // Show summary
    ui.alert(
      '🔍 Bounce Debug',
      `Thread: ${threadId}\n\n` +
      `From: ${from}\n` +
      `Subject: ${subject.substring(0, 50)}...\n\n` +
      `Check the Execution log for full email content.\n\n` +
      `Look for:\n` +
      `- Email addresses in the body\n` +
      `- Status codes (5.x.x, 4.x.x)\n` +
      `- Delivery failure messages`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert('Error', `Debug failed: ${error.message}`, ui.ButtonSet.OK);
    Logger.log(`Debug error: ${error.message}\n${error.stack}`);
  }
}

/**
 * Debug why emails are being skipped
 */
function debugSkippedEmails() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    Logger.log('=== Debug: Why are emails skipped? ===');
    
    // Check configuration
    const includeRead = getConfigBoolean('include_read_messages', false);
    const maxAgeDays = getConfigNumber('max_message_age_days', 7);
    const batchSize = getConfigNumber('batch_size', 20);
    
    Logger.log(`Config: include_read_messages = ${includeRead}`);
    Logger.log(`Config: max_message_age_days = ${maxAgeDays}`);
    Logger.log(`Config: batch_size = ${batchSize}`);
    
    // Check what emails are in inbox
    const unreadCount = GmailApp.search('in:inbox is:unread').length;
    const totalCount = GmailApp.search('in:inbox', 0, 50).length;
    
    Logger.log(`Inbox: ${unreadCount} unread, ${totalCount} total`);
    
    // Fetch threads using current config
    const threads = fetchUnreadThreads(batchSize);
    Logger.log(`Fetched ${threads.length} threads with current settings`);
    
    if (threads.length === 0) {
      let reason = '';
      if (!includeRead && unreadCount === 0) {
        reason = 'No UNREAD emails in inbox.\n\n' +
                 `Total emails in inbox: ${totalCount}\n\n` +
                 'SOLUTION: Set include_read_messages = true in Config.js\n' +
                 'or mark some emails as unread in Gmail.';
      } else if (totalCount === 0) {
        reason = 'Inbox is empty - no emails to process.';
      } else {
        reason = `Unknown - check Gmail search query results.\n\n` +
                 `Unread: ${unreadCount}, Total: ${totalCount}`;
      }
      
      ui.alert(
        '🔍 Debug: No Emails Fetched',
        reason,
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Check each thread
    let cacheSkipped = 0;
    let ageSkipped = 0;
    let processable = 0;
    
    threads.forEach(thread => {
      const metadata = extractThreadMetadata(thread);
      if (!metadata) return;
      
      Logger.log(`\nThread: ${metadata.subject.substring(0, 50)}...`);
      Logger.log(`  Thread ID: ${metadata.threadId}`);
      Logger.log(`  Unread: ${metadata.isUnread}`);
      
      // Check cache
      if (isProcessed(metadata.threadId)) {
        Logger.log(`  ✗ SKIP: In cache`);
        cacheSkipped++;
        return;
      }
      
      // Check age
      const messages = thread.getMessages();
      const lastMessage = messages[messages.length - 1];
      if (isMessageTooOld(lastMessage)) {
        const messageDate = lastMessage.getDate();
        const ageDays = Math.round((new Date() - messageDate) / (1000 * 60 * 60 * 24));
        Logger.log(`  ✗ SKIP: Too old (${ageDays} days, max ${maxAgeDays})`);
        ageSkipped++;
        return;
      }
      
      Logger.log(`  ✓ PROCESSABLE`);
      processable++;
    });
    
    // Show summary
    const message = `Debug Results:\n\n` +
      `Fetched: ${threads.length} threads\n` +
      `Skipped (cache): ${cacheSkipped}\n` +
      `Skipped (age): ${ageSkipped}\n` +
      `Processable: ${processable}\n\n` +
      `Configuration:\n` +
      `  include_read_messages: ${includeRead}\n` +
      `  max_message_age_days: ${maxAgeDays}\n\n` +
      `Inbox status:\n` +
      `  Unread emails: ${unreadCount}\n` +
      `  Total emails: ${totalCount}\n\n` +
      `Check Execution log for details.`;
    
    ui.alert('🔍 Debug Results', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '✗ Error',
      `Debug failed: ${error.message}\n\nCheck Execution log.`,
      ui.ButtonSet.OK
    );
    Logger.log(`Debug error: ${error.message}\n${error.stack}`);
  }
}

/**
 * Show Knowledge Base summary in a dialog
 */
function showKBSummary() {
  const kb = loadKnowledgeBase();
  const ui = SpreadsheetApp.getUi();
  
  if (!kb) {
    ui.alert('Error', 'Failed to load Knowledge Base', ui.ButtonSet.OK);
    return;
  }
  
  const message = `Knowledge Base v${kb.version}\n\n` +
    `Denylist rules: ${kb.denylist?.length || 0}\n` +
    `Processing rules: ${kb.rules?.length || 0}\n` +
    `Allowlist rules: ${kb.allowlist?.length || 0}\n\n` +
    `Total rules: ${(kb.denylist?.length || 0) + (kb.rules?.length || 0) + (kb.allowlist?.length || 0)}`;
  
  ui.alert('Knowledge Base Summary', message, ui.ButtonSet.OK);
}

/**
 * Show bounce patterns from KB
 */
function showBouncePatterns() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const kb = loadKnowledgeBase();
    const bounceRules = kb.rules.filter(rule => 
      rule.action && rule.action.type === 'bounce'
    );
    
    if (bounceRules.length === 0) {
      ui.alert('Bounce Patterns', 'No bounce rules defined in Knowledge Base.', ui.ButtonSet.OK);
      return;
    }
    
    let message = `Bounce Detection Rules (${bounceRules.length} total):\n\n`;
    
    bounceRules.forEach((rule, idx) => {
      message += `${idx + 1}. ${rule.id}\n`;
      message += `   ${rule.notes || 'No description'}\n`;
      if (rule.match) {
        rule.match.forEach(m => {
          message += `   - ${m.scope}: ${m.pattern}\n`;
        });
      }
      message += '\n';
    });
    
    ui.alert('Bounce Patterns', message, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', `Failed to load bounce patterns: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Test bounce detection on recent emails (manual)
 */
function testBounceDetectionManual() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    Logger.log('=== Manual Bounce Detection Test ===');
    
    // Fetch recent threads (max 10)
    const threads = fetchUnreadThreads(10);
    
    if (threads.length === 0) {
      ui.alert('Test Results', 'No unread threads found to test.', ui.ButtonSet.OK);
      return;
    }
    
    Logger.log(`Testing ${threads.length} threads...`);
    
    let bounceCount = 0;
    let regularCount = 0;
    let bounceDetails = [];
    
    threads.forEach(thread => {
      const metadata = extractThreadMetadata(thread);
      if (metadata) {
        const isBounce = isBounceEmail(thread, metadata);
        
        if (isBounce) {
          bounceCount++;
          const details = parseBounceDetails(metadata);
          bounceDetails.push({
            subject: metadata.subject.substring(0, 50),
            recipient: details.recipient,
            type: details.bounceType,
            code: details.statusCode
          });
          Logger.log(`✓ BOUNCE: ${metadata.subject}`);
          Logger.log(`  Recipient: ${details.recipient}, Type: ${details.bounceType}, Code: ${details.statusCode}`);
        } else {
          regularCount++;
          Logger.log(`✓ REGULAR: ${metadata.subject}`);
        }
      }
    });
    
    let message = `Tested ${threads.length} threads:\n\n` +
      `🔴 Bounces detected: ${bounceCount}\n` +
      `✉️ Regular emails: ${regularCount}\n\n`;
    
    if (bounceCount > 0) {
      message += 'Bounce Details:\n';
      bounceDetails.forEach((b, idx) => {
        message += `${idx + 1}. ${b.subject}...\n`;
        message += `   → ${b.recipient} (${b.type}, ${b.code})\n`;
      });
    } else {
      message += 'No bounces found in recent emails.';
    }
    
    message += '\n\nCheck Execution log for full details.';
    
    ui.alert('Bounce Detection Test', message, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Error', `Test failed: ${error.message}`, ui.ButtonSet.OK);
  }
}

