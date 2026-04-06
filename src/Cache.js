/**
 * Mythoria Email Engine - Cache Manager
 * 
 * Handles idempotency using Google Apps Script CacheService
 * Prevents reprocessing of threads/messages within TTL window
 */

/**
 * Get the script cache instance
 * @returns {GoogleAppsScript.Cache.Cache}
 */
function getCacheService() {
  return CacheService.getScriptCache();
}

/**
 * Generate a cache key for a thread
 * @param {string} threadId 
 * @returns {string}
 */
function getCacheKey(threadId) {
  return `processed:${threadId}`;
}

/**
 * Check if a thread has already been processed
 * @param {string} threadId 
 * @returns {boolean}
 */
function isProcessed(threadId) {
  if (!threadId) {
    return false;
  }
  
  const cache = getCacheService();
  const key = getCacheKey(threadId);
  const value = cache.get(key);
  
  return value !== null;
}

/**
 * Mark a thread as processed in cache
 * @param {string} threadId 
 * @returns {boolean} Success status
 */
function markProcessed(threadId) {
  if (!threadId) {
    Logger.log('Cannot mark processed: missing threadId');
    return false;
  }
  
  try {
    const cache = getCacheService();
    const key = getCacheKey(threadId);
    const ttl = getConfigNumber('cache_ttl', 21600); // Default 6 hours
    
    // Store timestamp as value for debugging
    const timestamp = new Date().toISOString();
    cache.put(key, timestamp, ttl);
    
    // Update key list for statistics
    updateCacheKeyList(threadId, true);
    
    Logger.log(`Marked thread ${threadId} as processed (TTL: ${ttl}s)`);
    return true;
  } catch (e) {
    Logger.log(`Error marking thread as processed: ${e.message}`);
    logError('CACHE_WRITE', `Failed to mark thread ${threadId} as processed`, { error: e.message });
    return false;
  }
}

/**
 * Update the list of cached keys (for statistics)
 * @param {string} threadId 
 * @param {boolean} add - true to add, false to remove
 */
function updateCacheKeyList(threadId, add) {
  try {
    const cache = getCacheService();
    const listKey = 'cache:keylist';
    const ttl = getConfigNumber('cache_ttl', 21600);
    
    // Get current list
    let keyListStr = cache.get(listKey) || '';
    let keyList = keyListStr ? keyListStr.split(',').filter(k => k) : [];
    
    if (add) {
      // Add if not already present
      if (!keyList.includes(threadId)) {
        keyList.push(threadId);
      }
    } else {
      // Remove if present
      keyList = keyList.filter(k => k !== threadId);
    }
    
    // Store updated list
    cache.put(listKey, keyList.join(','), ttl);
  } catch (e) {
    // Non-critical, just log
    Logger.log(`Warning: Failed to update cache key list: ${e.message}`);
  }
}

/**
 * Clear all processed cache entries (for testing/debugging)
 * Note: Due to CacheService limitations, we can only remove tracked keys.
 * Cache entries expire automatically after TTL (default 6 hours).
 */
function clearProcessedCache() {
  try {
    const cache = getCacheService();
    
    // Get current key list
    const listKey = 'cache:keylist';
    const keyListStr = cache.get(listKey) || '';
    const keyList = keyListStr ? keyListStr.split(',').filter(k => k) : [];
    
    Logger.log(`Attempting to clear cache with ${keyList.length} tracked keys...`);
    
    // Build full cache keys
    const keysToRemove = keyList.map(threadId => getCacheKey(threadId));
    
    // Remove tracked keys in batches (CacheService has limits)
    const batchSize = 50; // Safe batch size for removeAll
    let totalRemoved = 0;
    
    for (let i = 0; i < keysToRemove.length; i += batchSize) {
      const batch = keysToRemove.slice(i, i + batchSize);
      try {
        cache.removeAll(batch);
        totalRemoved += batch.length;
        Logger.log(`Removed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} keys`);
      } catch (batchError) {
        Logger.log(`Warning: Failed to remove batch: ${batchError.message}`);
        // Try individual removal as fallback
        batch.forEach(key => {
          try {
            cache.remove(key);
            totalRemoved++;
          } catch (keyError) {
            Logger.log(`Failed to remove key ${key}: ${keyError.message}`);
          }
        });
      }
    }
    
    // Finally, remove the key list itself
    cache.remove(listKey);
    
    Logger.log(`Cache cleared successfully (${totalRemoved} of ${keyList.length} thread(s) removed)`);
    return { success: true, removed: totalRemoved, total: keyList.length };
    
  } catch (e) {
    Logger.log(`Error clearing cache: ${e.message}`);
    return { success: false, error: e.message };
  }
}

/**
 * Get cache statistics (for debugging)
 * @returns {Object}
 */
function getCacheStats() {
  try {
    const cache = getCacheService();
    const listKey = 'cache:keylist';
    const keyListStr = cache.get(listKey) || '';
    const keyList = keyListStr ? keyListStr.split(',').filter(k => k) : [];
    
    // Validate keys still exist (cleanup expired ones)
    let validCount = 0;
    const stillValid = [];
    
    keyList.forEach(threadId => {
      if (isProcessed(threadId)) {
        validCount++;
        stillValid.push(threadId);
      }
    });
    
    // Update list if some expired
    if (validCount !== keyList.length) {
      cache.put(listKey, stillValid.join(','), getConfigNumber('cache_ttl', 21600));
    }
    
    return {
      ttl: getConfigNumber('cache_ttl', 21600),
      cachedThreads: validCount,
      ttlMinutes: Math.round(getConfigNumber('cache_ttl', 21600) / 60),
      ttlHours: Math.round(getConfigNumber('cache_ttl', 21600) / 3600)
    };
  } catch (e) {
    Logger.log(`Error getting cache stats: ${e.message}`);
    return {
      ttl: getConfigNumber('cache_ttl', 21600),
      cachedThreads: 0,
      error: e.message
    };
  }
}

/**
 * Check multiple threads at once (batch operation)
 * @param {string[]} threadIds 
 * @returns {Object} Map of threadId -> isProcessed
 */
function checkBatchProcessed(threadIds) {
  const cache = getCacheService();
  const keys = threadIds.map(id => getCacheKey(id));
  const results = cache.getAll(keys);
  
  const status = {};
  threadIds.forEach(threadId => {
    const key = getCacheKey(threadId);
    status[threadId] = results[key] !== undefined;
  });
  
  return status;
}

/**
 * Force clear cache by attempting to remove common patterns
 * Use this when the key list is corrupted or out of sync
 * 
 * NOTE: CacheService doesn't support pattern matching or listing keys,
 * so this attempts to remove keys based on common patterns from recent logs.
 */
function forceClearCache() {
  try {
    const cache = getCacheService();
    const ss = getSpreadsheet();
    
    Logger.log('Starting force cache clear...');
    
    // 1. Clear the key list
    cache.remove('cache:keylist');
    Logger.log('Removed cache key list');
    
    // 2. Try to get thread IDs from recent Messages_Log
    const messagesSheet = ss.getSheetByName('Messages_Log');
    if (messagesSheet && messagesSheet.getLastRow() > 1) {
      const range = messagesSheet.getRange(2, 1, Math.min(messagesSheet.getLastRow() - 1, 1000), 2);
      const data = range.getValues();
      
      const threadIds = data
        .map(row => row[1]) // Column B = threadId
        .filter(id => id && id.toString().trim());
      
      Logger.log(`Found ${threadIds.length} thread IDs from Messages_Log`);
      
      // Remove cache entries for these threads
      const keysToRemove = threadIds.map(id => getCacheKey(id.toString().trim()));
      
      const batchSize = 50;
      let totalRemoved = 0;
      
      for (let i = 0; i < keysToRemove.length; i += batchSize) {
        const batch = keysToRemove.slice(i, i + batchSize);
        try {
          cache.removeAll(batch);
          totalRemoved += batch.length;
        } catch (e) {
          // Try individual removal
          batch.forEach(key => {
            try {
              cache.remove(key);
              totalRemoved++;
            } catch (err) {
              // Silent fail for non-existent keys
            }
          });
        }
      }
      
      Logger.log(`Force clear complete. Attempted to remove ${totalRemoved} cache entries.`);
      return { success: true, attempted: keysToRemove.length, completed: totalRemoved };
    } else {
      Logger.log('No Messages_Log data found. Only cleared key list.');
      return { success: true, attempted: 0, completed: 0 };
    }
  } catch (e) {
    Logger.log(`Error during force clear: ${e.message}`);
    return { success: false, error: e.message };
  }
}

/**
 * Rebuild the cache key list from Messages_Log
 * Useful if the key list gets corrupted
 */
function rebuildCacheKeyList() {
  try {
    const cache = getCacheService();
    const ss = getSpreadsheet();
    const messagesSheet = ss.getSheetByName('Messages_Log');
    
    if (!messagesSheet || messagesSheet.getLastRow() <= 1) {
      Logger.log('No Messages_Log data to rebuild from');
      return { success: false, error: 'No data' };
    }
    
    // Get recent thread IDs (last 500 entries)
    const lastRow = messagesSheet.getLastRow();
    const startRow = Math.max(2, lastRow - 499);
    const range = messagesSheet.getRange(startRow, 1, lastRow - startRow + 1, 2);
    const data = range.getValues();
    
    // Check which ones are actually still in cache
    const stillCached = [];
    
    data.forEach(row => {
      const threadId = row[1];
      if (threadId && isProcessed(threadId.toString().trim())) {
        stillCached.push(threadId.toString().trim());
      }
    });
    
    // Update the key list
    const listKey = 'cache:keylist';
    const ttl = getConfigNumber('cache_ttl', 21600);
    cache.put(listKey, stillCached.join(','), ttl);
    
    Logger.log(`Cache key list rebuilt: ${stillCached.length} entries`);
    return { success: true, count: stillCached.length };
    
  } catch (e) {
    Logger.log(`Error rebuilding cache key list: ${e.message}`);
    return { success: false, error: e.message };
  }
}
