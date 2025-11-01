/**
 * Utility functions for Mythoria Email Engine
 */

/**
 * Log message to console and optionally to Google Sheets
 */
function logMessage(level, message, data) {
  const timestamp = new Date();
  const logEntry = {
    timestamp: timestamp,
    level: level,
    message: message,
    data: data ? JSON.stringify(data) : ''
  };
  
  // Log to console
  console.log(`[${level}] ${message}`, data || '');
  
  // Log to sheets if available
  try {
    if (CONFIG.SPREADSHEET_ID) {
      SheetsService.appendToSheet(CONFIG.SHEETS.LOGS, [
        timestamp,
        level,
        message,
        logEntry.data
      ]);
    }
  } catch (e) {
    console.error('Failed to log to sheets:', e);
  }
}

/**
 * Extract email metadata
 */
function extractEmailMetadata(message) {
  return {
    id: message.getId(),
    threadId: message.getThread().getId(),
    subject: message.getSubject(),
    from: message.getFrom(),
    to: message.getTo(),
    date: message.getDate(),
    snippet: message.getPlainBody().substring(0, 200),
    isUnread: message.isUnread(),
    labels: message.getThread().getLabels().map(label => label.getName())
  };
}

/**
 * Clean and normalize email content
 */
function cleanEmailContent(body) {
  // Remove HTML tags
  let clean = body.replace(/<[^>]*>/g, ' ');
  
  // Remove multiple spaces
  clean = clean.replace(/\s+/g, ' ');
  
  // Remove special characters
  clean = clean.replace(/[^\w\s\.\,\!\?\-\@]/g, '');
  
  // Trim
  clean = clean.trim();
  
  return clean;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format date for display
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(milliseconds) {
  Utilities.sleep(milliseconds);
}

/**
 * Retry function with exponential backoff
 */
function retryWithBackoff(func, maxRetries, initialDelay) {
  maxRetries = maxRetries || 3;
  initialDelay = initialDelay || 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return func();
    } catch (e) {
      if (i === maxRetries - 1) {
        throw e;
      }
      const delay = initialDelay * Math.pow(2, i);
      logMessage('WARN', `Retry attempt ${i + 1} after ${delay}ms`, { error: e.message });
      sleep(delay);
    }
  }
}

/**
 * Check if email is from monitored address
 */
function isMonitoredEmail(message) {
  const to = message.getTo().toLowerCase();
  const cc = message.getCc().toLowerCase();
  const monitoredAddress = CONFIG.EMAIL_ADDRESS.toLowerCase();
  
  return to.includes(monitoredAddress) || cc.includes(monitoredAddress);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common words
  const commonWords = ['this', 'that', 'with', 'from', 'have', 'more', 'will', 'would', 'could', 'should'];
  return words.filter(word => !commonWords.includes(word));
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(extractKeywords(str1));
  const words2 = new Set(extractKeywords(str2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate unique ID
 */
function generateId() {
  return Utilities.getUuid();
}
