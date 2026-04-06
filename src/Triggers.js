/**
 * Mythoria Email Engine - Trigger Management
 * 
 * Manages time-driven triggers for automated email processing
 */

/**
 * Create a scheduled time-driven trigger
 * @param {number} intervalMinutes - Interval in minutes (default: 10)
 * @returns {GoogleAppsScript.Script.Trigger}
 */
function createScheduledTrigger(intervalMinutes) {
  intervalMinutes = intervalMinutes || 10;
  
  try {
    // Delete existing triggers first to avoid duplicates
    deleteAllTriggers();
    
    // Create new trigger
    const trigger = ScriptApp.newTrigger('runEmailEngine')
      .timeBased()
      .everyMinutes(intervalMinutes)
      .create();
    
    Logger.log(`✓ Trigger created: runs every ${intervalMinutes} minute(s)`);
    Logger.log(`  Trigger ID: ${trigger.getUniqueId()}`);
    
    return trigger;
  } catch (e) {
    Logger.log(`Error creating trigger: ${e.message}`);
    logError('TRIGGER_CREATE', 'Failed to create scheduled trigger', { 
      interval: intervalMinutes,
      error: e.message 
    });
    throw e;
  }
}

/**
 * List all installed triggers for this project
 * @returns {GoogleAppsScript.Script.Trigger[]}
 */
function listTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    
    Logger.log(`Found ${triggers.length} trigger(s):`);
    
    triggers.forEach((trigger, index) => {
      const handlerFunction = trigger.getHandlerFunction();
      const eventType = trigger.getEventType();
      const triggerSource = trigger.getTriggerSource();
      
      Logger.log(`  ${index + 1}. ${handlerFunction} (${eventType}, ${triggerSource})`);
      Logger.log(`     ID: ${trigger.getUniqueId()}`);
    });
    
    return triggers;
  } catch (e) {
    Logger.log(`Error listing triggers: ${e.message}`);
    return [];
  }
}

/**
 * Delete all project triggers
 * Use with caution - removes ALL triggers
 */
function deleteAllTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    
    if (triggers.length === 0) {
      Logger.log('No triggers to delete');
      return;
    }
    
    Logger.log(`Deleting ${triggers.length} trigger(s)...`);
    
    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`  ✓ Deleted: ${trigger.getHandlerFunction()} (${trigger.getUniqueId()})`);
    });
    
    Logger.log('All triggers deleted');
  } catch (e) {
    Logger.log(`Error deleting triggers: ${e.message}`);
    logError('TRIGGER_DELETE', 'Failed to delete triggers', { error: e.message });
  }
}

/**
 * Delete a specific trigger by ID
 * @param {string} triggerId 
 */
function deleteTriggerById(triggerId) {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    
    for (let trigger of triggers) {
      if (trigger.getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(trigger);
        Logger.log(`✓ Deleted trigger: ${triggerId}`);
        return true;
      }
    }
    
    Logger.log(`Trigger not found: ${triggerId}`);
    return false;
  } catch (e) {
    Logger.log(`Error deleting trigger: ${e.message}`);
    return false;
  }
}

/**
 * Get recommended trigger interval based on configuration
 * @returns {number} Recommended interval in minutes
 */
function getRecommendedInterval() {
  const batchSize = getConfigNumber('batch_size', 20);
  
  // Simple heuristic:
  // - Small batch (< 10): 5 minutes
  // - Medium batch (10-30): 10 minutes
  // - Large batch (> 30): 15 minutes
  
  if (batchSize < 10) {
    return 5;
  } else if (batchSize <= 30) {
    return 10;
  } else {
    return 15;
  }
}

/**
 * Get trigger status and information
 * @returns {Object}
 */
function getTriggerStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  const emailTriggers = triggers.filter(t => t.getHandlerFunction() === 'runEmailEngine');
  
  return {
    totalTriggers: triggers.length,
    emailEngineTriggers: emailTriggers.length,
    triggers: emailTriggers.map(t => ({
      id: t.getUniqueId(),
      handler: t.getHandlerFunction(),
      type: t.getEventType().toString(),
      source: t.getTriggerSource().toString()
    })),
    recommendation: `Consider ${getRecommendedInterval()} minute interval based on batch_size=${getConfigNumber('batch_size', 20)}`
  };
}

/**
 * Install default trigger (10 minutes)
 * Called from menu
 */
function installDefaultTrigger() {
  try {
    createScheduledTrigger(10);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '✓ Trigger Installed',
      'Email engine will now run automatically every 10 minutes.\n\n' +
      'Use "List Triggers" to verify.\n' +
      'Use "Delete All Triggers" to stop automatic processing.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '✗ Error',
      `Failed to create trigger: ${e.message}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Install a trigger using the current batch-size recommendation.
 */
function installRecommendedTrigger() {
  const intervalMinutes = getRecommendedInterval();
  const ui = SpreadsheetApp.getUi();

  try {
    createScheduledTrigger(intervalMinutes);
    ui.alert(
      'Trigger Installed',
      `Email engine will now run automatically every ${intervalMinutes} minute(s).\n\nReview "View Trigger Status" for the current trigger list.`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert(
      'Error',
      `Failed to create trigger: ${e.message}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Show trigger status in a dialog.
 */
function showTriggerStatus() {
  const status = getTriggerStatus();
  const ui = SpreadsheetApp.getUi();
  const triggerLines = status.triggers.length > 0
    ? status.triggers.map(trigger => `  ${trigger.id} - ${trigger.type}`).join('\n')
    : '  No runEmailEngine triggers installed';

  ui.alert(
    'Trigger Status',
    `Project triggers: ${status.totalTriggers}\n` +
      `Email engine triggers: ${status.emailEngineTriggers}\n\n` +
      `Recommended interval: ${getRecommendedInterval()} minute(s)\n\n` +
      `Installed triggers:\n${triggerLines}`,
    ui.ButtonSet.OK
  );
}
