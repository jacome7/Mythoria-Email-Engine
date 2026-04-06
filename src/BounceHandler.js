/**
 * Mythoria Email Engine - Bounce Handler
 * 
 * Detects, classifies, and handles email bounces (DSN - Delivery Status Notifications)
 * Follows RFC 3464 standards for bounce detection
 */

/**
 * Check if an email is a bounce notification (DSN)
 * @param {GmailThread} thread - Gmail thread object
 * @param {Object} message - Extracted message metadata
 * @returns {boolean}
 */
function isBounceEmail(thread, message) {
  // Check sender patterns (case-insensitive)
  const fromLower = (message.from || '').toLowerCase();
  const bounceFromPatterns = [
    'mailer-daemon@',
    'postmaster@',
    'mail delivery subsystem',
    'mail delivery system',
    'noreply@'
  ];
  
  const hasBounceFrom = bounceFromPatterns.some(pattern => fromLower.includes(pattern));
  
  // Check subject patterns (case-insensitive)
  const subjectLower = (message.subject || '').toLowerCase();
  const bounceSubjectPatterns = [
    'delivery status notification',
    'undelivered mail',
    'undeliverable',
    'mail delivery failed',
    'returned mail',
    'failure notice',
    'delivery failure',
    'permanent error',
    'undeliverable message',
    'could not deliver',
    'address not found'
  ];
  
  const hasBounceSubject = bounceSubjectPatterns.some(pattern => subjectLower.includes(pattern));
  
  // Additional check: look for SMTP status codes in subject
  const hasStatusCodeInSubject = /\b[245]\.\d+\.\d+\b/.test(message.subject || '');
  
  // Consider it a bounce if:
  // 1. Sender is typical bounce sender OR
  // 2. Subject contains bounce keywords OR 
  // 3. Subject contains SMTP status codes
  return hasBounceFrom || hasBounceSubject || hasStatusCodeInSubject;
}

/**
 * Parse bounce details from message
 * Extracts recipient, status code, bounce type, and reason
 * @param {Object} message - Message metadata
 * @returns {Object} Bounce details
 */
function parseBounceDetails(message) {
  const body = message.body || '';
  const subject = message.subject || '';
  // Extract SMTP status code (e.g., 5.1.1, 4.4.1)
  // Try multiple patterns for better detection
  let statusCode = '';
  
  // Pattern 0: Microsoft/Outlook bounce format (check first - most specific)
  // Example: "Remote server returned '554 5.2.2 mailbox full"
  let statusCodeMatch = body.match(/Remote server.*?returned\s+['"](\d{3})\s+([245]\.\d+\.\d+)/i);
  if (statusCodeMatch) {
    statusCode = statusCodeMatch[2]; // Use extended code
  }
  
  // Pattern 1: Standard extended code (most specific)
  if (!statusCode) {
    statusCodeMatch = (body + ' ' + subject).match(/\b([245])\.(\d+)\.(\d+)\b/);
    if (statusCodeMatch) {
      statusCode = statusCodeMatch[0];
    }
  }
  
  // Pattern 2: Look for Diagnostic-Code lines (RFC 3464)
  if (!statusCode) {
    const diagnosticMatch = body.match(/Diagnostic-Code:.*?smtp;\s*(\d{3})\s+([245]\.\d+\.\d+)/i);
    if (diagnosticMatch) {
      statusCode = diagnosticMatch[2]; // Use extended code
    }
  }
  
  // Pattern 3: Look for Status: field (RFC 3464)
  if (!statusCode) {
    const statusFieldMatch = body.match(/Status:\s*([245]\.\d+\.\d+)/i);
    if (statusFieldMatch) {
      statusCode = statusFieldMatch[1];
    }
  }
  
  // Pattern 4: Three-digit SMTP code followed by extended code
  if (!statusCode) {
    const smtpCodeMatch = body.match(/\b(5\d{2})\s+([245]\.\d+\.\d+)/);
    if (smtpCodeMatch) {
      statusCode = smtpCodeMatch[2]; // Prefer extended code
    }
  }
  
  // Pattern 5: Just three-digit code (less reliable, map to extended)
  if (!statusCode) {
    const simpleCodeMatch = body.match(/\b(5\d{2}|4\d{2})\b/);
    if (simpleCodeMatch) {
      const code = simpleCodeMatch[1];
      // Map common 3-digit codes to extended codes
      const codeMap = {
        '550': '5.1.1', // User unknown
        '551': '5.1.1', // User not local
        '552': '5.2.2', // Mailbox full
        '553': '5.1.1', // Mailbox name invalid
        '554': '5.7.1', // Transaction failed / Spam
        '450': '4.4.1', // Temporary failure
        '451': '4.4.1', // Processing error
        '452': '4.2.2'  // Insufficient storage
      };
      statusCode = codeMap[code] || `${code.charAt(0)}.0.0`;
    }
  }
  
  Logger.log(`  Status code: ${statusCode || 'not found'}`);

  
  // Classify bounce type based on first digit
  let bounceType = 'unknown';
  if (statusCode.startsWith('5.')) {
    bounceType = 'hard'; // Permanent failure
  } else if (statusCode.startsWith('4.')) {
    bounceType = 'soft'; // Temporary failure
  } else if (statusCode.startsWith('2.')) {
    bounceType = 'success'; // Not really a bounce
  }
  
  // Extract recipient email address
  // Look for patterns like: "recipient@domain.com" or "<recipient@domain.com>"
  const recipientPatterns = [
    // Microsoft/Outlook bounce format (check first - very specific)
    // Example: "Delivery has failed to these recipients or groups:\n\nelisaramoss@hotmail.com"
    /Delivery has failed to these recipients or groups:[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /The recipient['']s mailbox is full[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    
    // Gmail-specific patterns
    /The following address\(es\) failed:[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /Address not found[\s\S]*?Your message to ([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /delivery to the following recipient failed permanently:[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    
    // Standard DSN patterns
    /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/,  // Bracketed email
    /Final-Recipient:.*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /Original-Recipient:.*rfc822;\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    
    // Common prefixes
    /to:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /recipient:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /for:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /failed for:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /sent to:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    
    // Email in quotes
    /"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/,
    /'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'/,
    
    // Plain email (last resort - might match wrong email)
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/
  ];
  
  let recipient = '';
  for (const pattern of recipientPatterns) {
    const match = body.match(pattern);
    if (match) {
      recipient = match[1] || match[0];
      // Clean up
      recipient = recipient.replace(/[<>"']/g, '').trim();
      
      // Skip if it's the sender's email (mailer-daemon, postmaster, etc.)
      const fromEmail = (message.from || '').toLowerCase();
      if (fromEmail.includes(recipient.toLowerCase())) {
        continue; // Try next pattern
      }
      
      // Skip common system addresses
      const systemAddresses = ['mailer-daemon', 'postmaster', 'noreply', 'no-reply'];
      if (systemAddresses.some(addr => recipient.toLowerCase().includes(addr))) {
        continue; // Try next pattern
      }
      
      // Valid recipient found
      break;
    }
  }
  
  // If still no recipient, try extracting from subject
  if (!recipient || recipient === '') {
    const subjectMatch = subject.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    if (subjectMatch) {
      recipient = subjectMatch[1].trim();
    }
  }
  
  // Extract bounce reason (common phrases)
  const reasonPatterns = [
    { pattern: /user unknown/i, reason: 'User unknown - mailbox does not exist' },
    { pattern: /mailbox unavailable/i, reason: 'Mailbox unavailable' },
    { pattern: /mailbox full/i, reason: 'Mailbox full - storage quota exceeded' },
    { pattern: /quota exceeded/i, reason: 'Quota exceeded' },
    { pattern: /address rejected/i, reason: 'Address rejected by recipient server' },
    { pattern: /relay access denied/i, reason: 'Relay access denied' },
    { pattern: /connection timed out/i, reason: 'Connection timed out' },
    { pattern: /domain not found/i, reason: 'Domain does not exist' },
    { pattern: /recipient address rejected/i, reason: 'Recipient address rejected' },
    { pattern: /delivery not authorized/i, reason: 'Delivery not authorized' },
    { pattern: /mailbox disabled/i, reason: 'Mailbox disabled' }
  ];
  
  let reason = 'Unknown bounce reason';
  for (const { pattern, reason: matchedReason } of reasonPatterns) {
    if (pattern.test(body)) {
      reason = matchedReason;
      break;
    }
  }
  
  // If no specific reason found but we have status code, use generic reason
  if (reason === 'Unknown bounce reason' && statusCode) {
    reason = getReasonFromStatusCode(statusCode);
  }
  
  return {
    recipient: recipient,
    statusCode: statusCode || 'unknown',
    bounceType: bounceType,
    reason: reason
  };
}

/**
 * Get bounce reason from SMTP status code
 * @param {string} code - SMTP status code (e.g., "5.1.1")
 * @returns {string}
 */
function getReasonFromStatusCode(code) {
  const codeMap = {
    '5.1.1': 'Bad destination mailbox address',
    '5.1.2': 'Bad destination system address',
    '5.2.1': 'Mailbox disabled, not accepting messages',
    '5.2.2': 'Mailbox full',
    '5.2.3': 'Message length exceeds administrative limit',
    '5.3.0': 'Other or undefined mail system status',
    '5.4.4': 'Unable to route',
    '5.5.0': 'Other or undefined protocol status',
    '5.7.1': 'Delivery not authorized, message refused',
    '4.2.2': 'Mailbox full (temporary)',
    '4.4.1': 'Connection timeout',
    '4.4.2': 'Bad connection',
    '4.4.7': 'Delivery expired (message too old)'
  };
  
  return codeMap[code] || `SMTP error ${code}`;
}

/**
 * Classify bounce type from status code
 * @param {string} statusCode - SMTP status code
 * @returns {string} 'hard' or 'soft' or 'unknown'
 */
function classifyBounceType(statusCode) {
  if (!statusCode || statusCode === 'unknown') {
    return 'unknown';
  }
  
  if (statusCode.startsWith('5.')) {
    return 'hard'; // Permanent failure
  } else if (statusCode.startsWith('4.')) {
    return 'soft'; // Temporary failure
  }
  
  return 'unknown';
}

/**
 * Main bounce handler - orchestrates bounce processing
 * @param {GmailThread} thread - Gmail thread
 * @param {Object} message - Message metadata
 * @param {Object} bounceDetails - Parsed bounce details
 * @returns {Object} Result object
 */
function handleBounce(thread, message, bounceDetails) {
  const threadId = thread.getId();
  const messageId = message.messageId || '';
  
  Logger.log(`🔴 BOUNCE DETECTED: ${bounceDetails.recipient} (${bounceDetails.statusCode})`);
  Logger.log(`   Type: ${bounceDetails.bounceType} | Reason: ${bounceDetails.reason}`);
  
  const result = {
    success: false,
    labeled: false,
    archived: false,
    apiCalled: false,
    apiSuccess: false,
    error: null
  };
  
  try {
    // Check dry run mode
    const dryRun = isDryRun();
    
    if (dryRun) {
      Logger.log('⚠️ DRY RUN: Would process bounce but taking no action');
    }
    
    // Report Bounce to Press Releases Webhook
    if (bounceDetails.recipient) {
      try {
        const pressApiBase = getScriptProperty('press_api_base');
        const pressApiToken = getScriptProperty('press_api_token');
        if (pressApiBase && pressApiToken) {
          const payload = {
            event: 'bounce',
            email: bounceDetails.recipient,
            details: bounceDetails.statusCode + ' ' + bounceDetails.reason
          };
          UrlFetchApp.fetch(pressApiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            payload: JSON.stringify({ ...payload, token: pressApiToken }),
            muteHttpExceptions: true
          });
          Logger.log('Called Press API for bounce: ' + bounceDetails.recipient);
        }
      } catch (e) {
        Logger.log('Failed to notify Press API of bounce: ' + e.message);
      }
    }

    // Step 1: Call Mythoria Bounce API (if recipient is known)
    if (bounceDetails.recipient && bounceDetails.recipient !== '') {
      try {
        const apiResponse = callMythoriaBounceAPI(bounceDetails);
        result.apiCalled = true;
        result.apiSuccess = apiResponse.success;
        
        // Log bounce to Sheet with API response
        logBounce({
          threadId: threadId,
          messageId: messageId,
          recipient: bounceDetails.recipient,
          statusCode: bounceDetails.statusCode,
          bounceType: bounceDetails.bounceType,
          reason: bounceDetails.reason,
          apiResponse: apiResponse.message || JSON.stringify(apiResponse),
          status: apiResponse.success ? 'reported' : 'api_failed'
        });
        
        if (apiResponse.success) {
          Logger.log(`✅ Bounce reported to Mythoria API for ${bounceDetails.recipient}`);
        } else {
          Logger.log(`⚠️ Mythoria API call failed: ${apiResponse.message}`);
        }
        
      } catch (apiError) {
        Logger.log(`❌ Error calling Mythoria Bounce API: ${apiError.message}`);
        result.error = apiError.message;
        
        // Log bounce with error status
        logBounce({
          threadId: threadId,
          messageId: messageId,
          recipient: bounceDetails.recipient,
          statusCode: bounceDetails.statusCode,
          bounceType: bounceDetails.bounceType,
          reason: bounceDetails.reason,
          apiResponse: `ERROR: ${apiError.message}`,
          status: 'api_error'
        });
        
        // Log to Errors tab
        logError('BOUNCE_API', 'Failed to call Mythoria Bounce API', {
          recipient: bounceDetails.recipient,
          statusCode: bounceDetails.statusCode,
          error: apiError.message
        });
      }
    } else {
      // No recipient found - log anyway
      Logger.log('⚠️ Could not extract recipient email from bounce');
      logBounce({
        threadId: threadId,
        messageId: messageId,
        recipient: 'unknown',
        statusCode: bounceDetails.statusCode,
        bounceType: bounceDetails.bounceType,
        reason: bounceDetails.reason,
        apiResponse: 'Recipient not found in bounce message',
        status: 'no_recipient'
      });
    }
    
    // Step 2: Apply Gmail label (unless dry run)
    if (!dryRun) {
      const bounceLabel = getConfigValue('labels_bounce', 'Mythoria/Bounce');
      const label = GmailApp.getUserLabelByName(bounceLabel);
      
      if (label) {
        thread.addLabel(label);
        result.labeled = true;
        Logger.log(`🏷️ Applied label: ${bounceLabel}`);
      } else {
        Logger.log(`⚠️ Label not found: ${bounceLabel}`);
      }
    }
    
    // Step 3: Archive thread (only if API call succeeded or no API call needed)
    const shouldArchive = getConfigBoolean('bounce_archive', true);
    if (!dryRun && shouldArchive && (result.apiSuccess || !bounceDetails.recipient)) {
      thread.moveToArchive();
      result.archived = true;
      Logger.log('📦 Thread archived');
    } else if (!result.apiSuccess && bounceDetails.recipient) {
      Logger.log('⚠️ Not archiving - API call failed (keep visible for retry)');
    }
    
    // Step 4: Mark as read
    const shouldMarkRead = getConfigBoolean('mark_as_read_after_processing', true);
    if (!dryRun && shouldMarkRead) {
      thread.markRead();
      Logger.log('👁️ Marked as read');
    }
    
    result.success = true;
    return result;
    
  } catch (error) {
    Logger.log(`❌ Error in handleBounce: ${error.message}`);
    result.error = error.message;
    
    logError('HANDLE_BOUNCE', 'Failed to handle bounce', {
      threadId: threadId,
      recipient: bounceDetails.recipient,
      error: error.message,
      stack: error.stack
    });
    
    return result;
  }
}

/**
 * Call Mythoria Bounce API to report bounce
 * @param {Object} bounceDetails - Bounce details
 * @returns {Object} API response
 */
function callMythoriaBounceAPI(bounceDetails) {
  try {
    // Get configuration
    const apiBase = getMythoriaBase();
    const apiToken = getMythoriaToken();
    const endpoint = getConfigValue('mythoria_bounce_endpoint', '/api/admin/leads/bounce');
    
    const url = apiBase + endpoint;
    
    // Determine email status based on bounce type
    let emailStatus = 'hard_bounce';
    if (bounceDetails.bounceType === 'soft') {
      emailStatus = 'soft_bounce';
    }
    
    // Prepare payload
    const payload = {
      email: bounceDetails.recipient,
      emailStatus: emailStatus,
      bounceReason: bounceDetails.reason,
      bounceCode: bounceDetails.statusCode
    };
    
    // Make API request
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    Logger.log(`📡 Calling Mythoria Bounce API: ${url}`);
    Logger.log(`   Email: ${bounceDetails.recipient} | Status: ${emailStatus}`);
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log(`   Response: ${responseCode}`);
    
    if (responseCode >= 200 && responseCode < 300) {
      return {
        success: true,
        statusCode: responseCode,
        message: `Successfully reported bounce for ${bounceDetails.recipient}`,
        data: responseBody
      };
    } else {
      return {
        success: false,
        statusCode: responseCode,
        message: `API returned ${responseCode}: ${responseBody}`,
        data: responseBody
      };
    }
    
  } catch (error) {
    Logger.log(`❌ Exception in callMythoriaBounceAPI: ${error.message}`);
    return {
      success: false,
      statusCode: 0,
      message: `Exception: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Extract bounce patterns from kb.json for dynamic detection
 * This allows easy extension of bounce patterns via the knowledge base
 * @returns {Object} Bounce patterns
 */
function getBouncePatterns() {
  try {
    const kb = loadKnowledgeBase();
    const bounceRules = kb.rules.filter(rule => 
      rule.action && rule.action.type === 'bounce'
    );
    
    const patterns = {
      fromPatterns: [],
      subjectPatterns: []
    };
    
    bounceRules.forEach(rule => {
      if (rule.match) {
        rule.match.forEach(matcher => {
          if (matcher.scope === 'from' || matcher.scope === 'from_local') {
            patterns.fromPatterns.push(matcher.pattern);
          } else if (matcher.scope === 'subject') {
            patterns.subjectPatterns.push(matcher.pattern);
          }
        });
      }
    });
    
    return patterns;
  } catch (error) {
    Logger.log(`Warning: Could not load bounce patterns from KB: ${error.message}`);
    return { fromPatterns: [], subjectPatterns: [] };
  }
}
