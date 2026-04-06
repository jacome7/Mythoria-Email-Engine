/**
 * Mythoria Email Engine - Gmail Fetcher
 * 
 * Handles fetching and parsing Gmail threads and messages
 */

/**
 * Check if current time is within the configured run window
 * @returns {boolean}
 */
function isWithinRunWindow() {
  return isInRunWindow();
}

/**
 * Check if a message is too old to process
 * @param {GoogleAppsScript.Gmail.GmailMessage} message 
 * @returns {boolean}
 */
function isMessageTooOld(message) {
  const maxAgeDays = getConfigNumber('max_message_age_days', 7);
  
  // 0 means no age limit
  if (maxAgeDays === 0) {
    return false;
  }
  
  try {
    const messageDate = message.getDate();
    const now = new Date();
    const ageMs = now - messageDate;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    
    return ageDays > maxAgeDays;
  } catch (e) {
    Logger.log(`Error checking message age: ${e.message}`);
    return false; // Default to not too old on error
  }
}

/**
 * Fetch unread Gmail threads
 * @param {number} maxThreads - Maximum number of threads to fetch
 * @returns {GoogleAppsScript.Gmail.GmailThread[]}
 */
function fetchUnreadThreads(maxThreads) {
  try {
    const includeRead = getConfigBoolean('include_read_messages', false);
    
    // Build Gmail search query
    let query = 'in:inbox';
    if (!includeRead) {
      query += ' is:unread';
    }
    
    Logger.log(`Fetching threads with query: "${query}", max: ${maxThreads}`);
    
    // Fetch threads
    const threads = GmailApp.search(query, 0, maxThreads);
    
    Logger.log(`Fetched ${threads.length} thread(s)`);
    return threads;
  } catch (e) {
    Logger.log(`Error fetching threads: ${e.message}`);
    logError('FETCH_THREADS', 'Failed to fetch Gmail threads', { error: e.message });
    return [];
  }
}

/**
 * Extract metadata from a Gmail thread
 * @param {GoogleAppsScript.Gmail.GmailThread} thread 
 * @returns {Object|null}
 */
function extractThreadMetadata(thread) {
  try {
    const messages = thread.getMessages();
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    
    // Get thread labels
    const labels = thread.getLabels().map(label => label.getName());
    
    // Get snippet from last message (threads don't have getSnippet method)
    const snippet = lastMessage.getPlainBody().substring(0, 200);
    
    // Get FULL body from last message (needed for bounce detection)
    const body = lastMessage.getPlainBody();
    
    return {
      threadId: thread.getId(),
      messageCount: messages.length,
      firstMessageId: firstMessage.getId(),
      lastMessageId: lastMessage.getId(),
      from: lastMessage.getFrom(),
      to: lastMessage.getTo(),
      subject: thread.getFirstMessageSubject(),
      date: lastMessage.getDate(),
      labels: labels,
      snippet: snippet,
      body: body, // Full body for bounce detection
      isUnread: thread.isUnread(),
      permalink: thread.getPermalink()
    };
  } catch (e) {
    Logger.log(`Error extracting thread metadata: ${e.message}`);
    logError('PARSE_THREAD', 'Failed to parse thread metadata', { 
      threadId: thread ? thread.getId() : 'unknown',
      error: e.message 
    });
    return null;
  }
}

/**
 * Extract metadata from a Gmail message
 * @param {GoogleAppsScript.Gmail.GmailMessage} message 
 * @returns {Object|null}
 */
function extractMessageMetadata(message) {
  try {
    return {
      messageId: message.getId(),
      threadId: message.getThread().getId(),
      from: message.getFrom(),
      to: message.getTo(),
      cc: message.getCc(),
      subject: message.getSubject(),
      date: message.getDate(),
      snippet: message.getPlainBody().substring(0, 200), // First 200 chars
      isUnread: message.isUnread(),
      isStarred: message.isStarred(),
      hasAttachment: message.getAttachments().length > 0
    };
  } catch (e) {
    Logger.log(`Error extracting message metadata: ${e.message}`);
    return null;
  }
}

/**
 * Get detailed thread information including all messages
 * @param {GoogleAppsScript.Gmail.GmailThread} thread 
 * @returns {Object|null}
 */
function getThreadDetails(thread) {
  try {
    const metadata = extractThreadMetadata(thread);
    if (!metadata) {
      return null;
    }
    
    // Get all messages in thread
    const messages = thread.getMessages();
    metadata.messages = messages.map(msg => extractMessageMetadata(msg)).filter(m => m !== null);
    
    return metadata;
  } catch (e) {
    Logger.log(`Error getting thread details: ${e.message}`);
    return null;
  }
}

/**
 * Parse email address to extract local and domain parts
 * @param {string} email - Email in format "Name <email@domain.com>" or "email@domain.com"
 * @returns {Object}
 */
function parseEmailAddress(email) {
  try {
    // Extract email from "Name <email@domain.com>" format
    const match = email.match(/<(.+?)>/);
    const cleanEmail = match ? match[1] : email;
    
    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
      return { email: cleanEmail, local: cleanEmail, domain: '' };
    }
    
    return {
      email: cleanEmail,
      local: parts[0],
      domain: parts[1]
    };
  } catch (e) {
    Logger.log(`Error parsing email address: ${e.message}`);
    return { email: email, local: '', domain: '' };
  }
}
