/**
 * Configuration management for Mythoria Email Engine
 */

const CONFIG = {
  // Email configuration
  EMAIL_ADDRESS: 'hello@mythoria.pt',
  BATCH_SIZE: 50, // Process 50 emails at a time
  
  // Google Sheets configuration
  SPREADSHEET_ID: '', // Set your Google Sheets ID here
  SHEETS: {
    PROCESSED_EMAILS: 'ProcessedEmails',
    KNOWLEDGE_BASE: 'KnowledgeBase',
    CLASSIFICATIONS: 'Classifications',
    SUMMARIES: 'Summaries',
    LOGS: 'Logs'
  },
  
  // OpenAI configuration
  OPENAI_API_KEY: '', // Set your OpenAI API key here
  OPENAI_MODEL: 'gpt-4',
  OPENAI_MAX_TOKENS: 500,
  
  // Gmail labels
  LABELS: {
    PROCESSED: 'Mythoria/Processed',
    SUPPORT: 'Mythoria/Support',
    SALES: 'Mythoria/Sales',
    TECHNICAL: 'Mythoria/Technical',
    GENERAL: 'Mythoria/General',
    URGENT: 'Mythoria/Urgent',
    LOW_PRIORITY: 'Mythoria/LowPriority'
  },
  
  // Classification thresholds
  CONFIDENCE_THRESHOLD: 0.7,
  
  // Trigger configuration
  TRIGGER_INTERVAL_MINUTES: 15
};

/**
 * Get configuration value
 */
function getConfig(key) {
  return CONFIG[key];
}

/**
 * Get all configuration
 */
function getAllConfig() {
  return CONFIG;
}

/**
 * Initialize configuration from Script Properties
 * This allows configuration to be set via UI or deployment
 */
function initializeConfig() {
  const props = PropertiesService.getScriptProperties();
  
  // Override with script properties if they exist
  if (props.getProperty('OPENAI_API_KEY')) {
    CONFIG.OPENAI_API_KEY = props.getProperty('OPENAI_API_KEY');
  }
  if (props.getProperty('SPREADSHEET_ID')) {
    CONFIG.SPREADSHEET_ID = props.getProperty('SPREADSHEET_ID');
  }
  if (props.getProperty('EMAIL_ADDRESS')) {
    CONFIG.EMAIL_ADDRESS = props.getProperty('EMAIL_ADDRESS');
  }
}

/**
 * Set configuration via Script Properties
 */
function setConfigProperty(key, value) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(key, value);
  initializeConfig();
}
