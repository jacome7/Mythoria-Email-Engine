/**
 * Mythoria Email Engine - Configuration
 * 
 * All configuration settings are defined here.
 * This file is the single source of truth for configuration.
 * 
 * IMPORTANT: Edit values here, not in the Sheet.
 * The Config Sheet tab is NOT used.
 */

/**
 * Get the complete configuration object
 * @returns {Object} Configuration settings
 */
function getConfig() {
  return {
    // ============================================
    // GENERAL SETTINGS
    // ============================================
    
    /**
     * Enable or disable the email engine
     * Set to false to completely stop processing
     */
    enabled: true,
    
    /**
     * Dry run mode - if true, no actual actions are taken
     * Use for testing without making real changes
     */
    dry_run: false,
    
    /**
     * Number of messages to process per run
     * Keep low to avoid quota limits
     */
    batch_size: 20,
    
    /**
     * Operating hours in 24h format (HH:mm-HH:mm)
     * Empty string means no restriction
     * Example: "08:00-20:00" for business hours only
     */
    run_window: '07:00-23:00',
    
    /**
     * Timezone for scheduling and timestamps
     * Must be a valid timezone identifier
     * Examples: "Europe/Lisbon", "America/New_York", "UTC"
     */
    tz: 'Europe/Lisbon',
    
    // ============================================
    // OPENAI SETTINGS
    // ============================================
    
    /**
     * Model for cheap classification
     * Used for category/priority detection
     * Recommended: gpt-5-mini (fast and cheap)
     */
    openai_model_classify: 'gpt-5-mini',
    
    /**
     * Model for quality drafts and summaries
     * Used when generating customer-facing content
     * Recommended: gpt-5 (better quality)
     */
    openai_model_draft: 'gpt-5',
    
    /**
     * OpenAI API base URL
     * Usually doesn't need to change
     */
    openai_base: 'https://api.openai.com/v1',
    
    // ============================================
    // GMAIL LABEL SETTINGS
    // ============================================
    
    /**
     * Label applied when ticket is created
     */
    labels_ticketed: 'Mythoria/Ticketed',
    
    /**
     * Label applied when bounce is detected
     */
    labels_bounce: 'Mythoria/Bounce',
    
    /**
     * Label applied when message is skipped (no action)
     */
    labels_no_action: 'Mythoria/No-Action',
    
    /**
     * Label applied when manual review is needed
     */
    labels_needs_review: 'Mythoria/Needs-Review',
    
    // ============================================
    // DRAFT GENERATION SETTINGS
    // ============================================
    
    /**
     * Minimum confidence score to auto-create draft
     * Range: 0.0 to 1.0
     * Higher = more conservative
     */
    min_confidence: 0.7,
    
    /**
     * Priorities that get draft replies
     * Comma-separated list
     * Example: "P0,P1,P2" means P0, P1, and P2 get drafts
     */
    draft_priorities: 'P0,P1,P2',
    
    /**
     * Priorities that use the larger model for better quality
     * Comma-separated list
     * Example: "P0,P1" means only urgent cases use expensive model
     */
    escalate_priorities: 'P0,P1',
    
    // ============================================
    // ADVANCED SETTINGS
    // ============================================
    
    /**
     * Maximum retries for failed API calls
     */
    max_retries: 2,

    /**
     * Time to wait for the script execution lock in milliseconds
     * Prevents overlapping trigger runs from processing the same inbox state
     */
    lock_timeout_ms: 5000,
    
    /**
     * Delay between retries in seconds
     */
    retry_delay: 5,
    
    /**
     * Cache TTL in seconds (for idempotency)
     * Max allowed by GAS is 21600 (6 hours)
     */
    cache_ttl: 21600,
    
    /**
     * Maximum age of messages to process (in days)
     * Messages older than this are skipped
     * Set to 0 to disable age filtering
     */
    max_message_age_days: 7,
    
    /**
     * Include read messages in processing
     * If false, only unread messages are processed
     */
    include_read_messages: false,
    
    /**
     * Mark messages as read after processing
     */
    mark_as_read_after_processing: true,
    
    // ============================================
    // BOUNCE HANDLING SETTINGS
    // ============================================
    
    /**
     * Archive bounce emails after processing
     * If false, bounces remain in inbox after labeling
     * Note: If API call fails, bounce is NOT archived (kept visible for retry)
     */
    bounce_archive: true,
    
    /**
     * Mythoria Bounce API endpoint path
     * Combined with mythoria_api_base to form full URL
     * Example: /api/admin/leads/bounce
     */
    mythoria_bounce_endpoint: '/api/admin/leads/bounce',
    
    // ============================================
    // DMARC SETTINGS
    // ============================================
    
    /**
     * Enable DMARC report processing
     * Set to false to disable DMARC ingestion
     */
    dmarc_enabled: true,
    
    /**
     * Gmail label for DMARC aggregate reports
     * Messages with this label will be processed
     */
    dmarc_label: 'Mythoria/DMARC',
    
    /**
     * Number of DMARC messages to process per run
     */
    dmarc_batch_size: 50,
    
    /**
     * Delete DMARC messages after processing
     * If true, messages are moved to trash after successful processing
     */
    dmarc_delete_after_processing: true
  };
}

/**
 * Get a single configuration value
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*}
 */
function getConfigValue(key, defaultValue = null) {
  const config = getConfig();
  return config.hasOwnProperty(key) ? config[key] : defaultValue;
}

/**
 * Get a configuration value as boolean
 * @param {string} key 
 * @param {boolean} defaultValue 
 * @returns {boolean}
 */
function getConfigBoolean(key, defaultValue = false) {
  const value = getConfigValue(key, defaultValue);
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value).toLowerCase() === 'true';
}

/**
 * Get a configuration value as number
 * @param {string} key 
 * @param {number} defaultValue 
 * @returns {number}
 */
function getConfigNumber(key, defaultValue = 0) {
  const value = getConfigValue(key, defaultValue);
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get a configuration value as array (comma-separated)
 * @param {string} key 
 * @param {Array} defaultValue 
 * @returns {Array}
 */
function getConfigArray(key, defaultValue = []) {
  const value = getConfigValue(key, '');
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || value === '') {
    return defaultValue;
  }
  return String(value).split(',').map(v => v.trim()).filter(v => v !== '');
}

/**
 * Check if the engine is currently enabled
 * @returns {boolean}
 */
function isEnabled() {
  return getConfigBoolean('enabled', true);
}

/**
 * Check if we're in dry-run mode
 * @returns {boolean}
 */
function isDryRun() {
  return getConfigBoolean('dry_run', false);
}

/**
 * Check if current time is within run window
 * @returns {boolean}
 */
function isInRunWindow() {
  const window = getConfigValue('run_window', '');
  const tz = getConfigValue('tz', 'Europe/Lisbon');
  
  if (!window || window === '') {
    return true; // No restriction
  }
  
  try {
    const [start, end] = window.split('-').map(t => t.trim());
    const now = new Date();
    const currentTime = Utilities.formatDate(now, tz, 'HH:mm');
    
    return currentTime >= start && currentTime <= end;
  } catch (error) {
    Logger.log(`ERROR parsing run_window: ${error.message}`);
    return true; // Default to allowing run
  }
}

/**
 * Get OpenAI API key from Script Properties
 * @returns {string}
 */
function getOpenAIKey() {
  const key = getScriptProperty('openai_api_key');
  if (!key) {
    throw new Error('OpenAI API key not set. Add openai_api_key in Project Settings -> Script Properties.');
  }
  return key;
}

/**
 * Get Mythoria API base URL from Script Properties
 * @returns {string}
 */
function getMythoriaBase() {
  const base = getScriptProperty('mythoria_api_base');
  if (!base) {
    throw new Error('Mythoria API base not set. Add mythoria_api_base in Project Settings -> Script Properties.');
  }
  return base;
}

/**
 * Get Mythoria API token from Script Properties
 * @returns {string}
 */
/**
 * Get Press API base URL from Script Properties
 * @returns {string}
 */
function getPressApiBase() {
  const base = getScriptProperty('press_api_base');
  if (!base) {
    throw new Error('Press API base not set. Add press_api_base in Project Settings -> Script Properties.');
  }
  return base;
}

/**
 * Get Press API token from Script Properties
 * @returns {string}
 */
function getPressApiToken() {
  const token = getScriptProperty('press_api_token');
  if (!token) {
    throw new Error('Press API token not set. Add press_api_token in Project Settings -> Script Properties.');
  }
  return token;
}

function getMythoriaToken() {
  const token = getScriptProperty('mythoria_api_token');
  if (!token) {
    throw new Error('Mythoria API token not set. Add mythoria_api_token in Project Settings -> Script Properties.');
  }
  return token;
}

/**
 * Display current configuration in a dialog
 * Useful for debugging and verification
 */
function showConfiguration() {
  const config = getConfig();
  const ui = SpreadsheetApp.getUi();
  
  let message = '📋 Current Configuration:\n\n';
  
  // Group settings
  const groups = {
    'General': ['enabled', 'dry_run', 'batch_size', 'run_window', 'tz'],
    'OpenAI': ['openai_model_classify', 'openai_model_draft', 'openai_base'],
    'Labels': ['labels_ticketed', 'labels_bounce', 'labels_no_action', 'labels_needs_review'],
    'Drafts': ['min_confidence', 'draft_priorities', 'escalate_priorities'],
    'Advanced': ['max_retries', 'lock_timeout_ms', 'retry_delay', 'cache_ttl', 'max_message_age_days']
  };
  
  for (const [group, keys] of Object.entries(groups)) {
    message += `\n${group}:\n`;
    keys.forEach(key => {
      if (config.hasOwnProperty(key)) {
        message += `  ${key}: ${config[key]}\n`;
      }
    });
  }
  
  // Check Script Properties
  message += '\n🔐 Script Properties:\n';
  message += `  openai_api_key: ${getScriptProperty('openai_api_key') ? '✓ SET' : '✗ NOT SET'}\n`;
  message += `  mythoria_api_token: ${getScriptProperty('mythoria_api_token') ? '✓ SET' : '✗ NOT SET'}\n`;
  message += `  mythoria_api_base: ${getScriptProperty('mythoria_api_base') || 'NOT SET'}\n`;
  
  ui.alert('Configuration', message, ui.ButtonSet.OK);
}
