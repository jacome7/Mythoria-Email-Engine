/**
 * Mythoria Email Engine - Knowledge Base Loader
 * 
 * Functions to load and parse the generated KB source.
 * The authoring source is src/kb.json, which is synced into KbData.js
 * before pushing to Apps Script.
 */

/**
 * Load and parse the Knowledge Base JSON file
 * @returns {Object|null} Parsed KB object or null on error
 */
function loadKnowledgeBase() {
  try {
    const kbContent = getKBFileContent();
    
    if (!kbContent) {
      logError('KB_LOAD', 'kb.json file not found in project', {});
      return null;
    }
    
    const kb = safeJsonParse(kbContent);
    
    if (!kb) {
      logError('KB_LOAD', 'Failed to parse kb.json - invalid JSON', {});
      return null;
    }
    
    // Validate KB structure
    if (!validateKBStructure(kb)) {
      logError('KB_LOAD', 'Invalid KB structure', { version: kb.version });
      return null;
    }
    
    Logger.log(`Knowledge Base loaded: v${kb.version}, ${getTotalRules(kb)} total rules`);
    return kb;
    
  } catch (error) {
    logError('KB_LOAD', `Exception loading KB: ${error.message}`, { stack: error.stack });
    return null;
  }
}

/**
 * Get KB JSON content prepared for the Apps Script runtime.
 * @returns {string}
 */
function getKBFileContent() {
  if (typeof KB_JSON_SOURCE === 'string' && KB_JSON_SOURCE.trim() !== '') {
    return KB_JSON_SOURCE;
  }
  Logger.log('KB runtime payload missing. Run "npm run sync:kb" before pushing with clasp.');
  return null;
}

/**
 * Validate KB structure
 * @param {Object} kb 
 * @returns {boolean}
 */
function validateKBStructure(kb) {
  if (!kb.version) {
    Logger.log('KB validation failed: missing version');
    return false;
  }
  
  if (!Array.isArray(kb.denylist)) {
    kb.denylist = [];
  }
  
  if (!Array.isArray(kb.rules)) {
    Logger.log('KB validation failed: rules must be an array');
    return false;
  }
  
  if (!Array.isArray(kb.allowlist)) {
    kb.allowlist = [];
  }
  
  return true;
}

/**
 * Get total number of rules in KB
 * @param {Object} kb 
 * @returns {number}
 */
function getTotalRules(kb) {
  return (kb.denylist?.length || 0) + 
         (kb.rules?.length || 0) + 
         (kb.allowlist?.length || 0);
}

/**
 * Find matching rule in KB for given message data
 * @param {Object} kb - Knowledge Base
 * @param {Object} messageData - Message data to match against
 * @returns {Object|null} Matching rule with action, or null
 */
function findMatchingRule(kb, messageData) {
  // Order: denylist → rules → allowlist
  
  // Check denylist first
  for (const rule of (kb.denylist || [])) {
    if (matchesRule(rule, messageData)) {
      return {
        action: { type: 'skip' },
        source: 'denylist',
        notes: rule.notes
      };
    }
  }
  
  // Check main rules
  for (const rule of (kb.rules || [])) {
    if (matchesRule(rule, messageData)) {
      return {
        action: rule.action,
        source: rule.id || 'rule',
        notes: rule.notes
      };
    }
  }
  
  // Check allowlist
  for (const rule of (kb.allowlist || [])) {
    if (matchesRule(rule, messageData)) {
      return {
        action: { 
          type: rule.action || 'ticket',
          priority: rule.priority || 'P2',
          category: rule.category || 'general'
        },
        source: 'allowlist',
        notes: rule.notes
      };
    }
  }
  
  return null; // No match - will need LLM
}

/**
 * Check if a single rule matches message data
 * @param {Object} rule 
 * @param {Object} messageData 
 * @returns {boolean}
 */
function matchesRule(rule, messageData) {
  // Simple rule (single match)
  if (rule.scope && rule.pattern) {
    return matchesPattern(rule.scope, rule.pattern, rule.flags, messageData);
  }
  
  // Complex rule (multiple matches - all must match)
  if (Array.isArray(rule.match)) {
    return rule.match.every(m => matchesPattern(m.scope, m.pattern, m.flags, messageData));
  }
  
  return false;
}

/**
 * Check if a pattern matches against message data
 * @param {string} scope - Which field to check
 * @param {string} pattern - Regex pattern
 * @param {string} flags - Regex flags
 * @param {Object} messageData 
 * @returns {boolean}
 */
function matchesPattern(scope, pattern, flags, messageData) {
  try {
    const regex = new RegExp(pattern, flags || '');
    const value = getValueByScope(scope, messageData);
    
    return regex.test(value);
  } catch (error) {
    Logger.log(`Error matching pattern: ${error.message}`);
    return false;
  }
}

/**
 * Get message data value by scope
 * @param {string} scope 
 * @param {Object} messageData 
 * @returns {string}
 */
function getValueByScope(scope, messageData) {
  switch (scope) {
    case 'from':
      return messageData.from || '';
    case 'from_domain':
      return extractDomain(messageData.from || '');
    case 'from_local':
      return extractLocal(messageData.from || '');
    case 'subject':
      return messageData.subject || '';
    case 'body':
      return messageData.body || '';
    case 'label':
      return (messageData.labels || []).join(',');
    case 'has_attachment':
      return messageData.hasAttachment ? 'true' : 'false';
    default:
      return '';
  }
}

/**
 * Extract domain from email address
 * @param {string} email 
 * @returns {string}
 */
function extractDomain(email) {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : '';
}

/**
 * Extract local part from email address
 * @param {string} email 
 * @returns {string}
 */
function extractLocal(email) {
  const match = email.match(/^([^@]+)@/);
  return match ? match[1] : '';
}
