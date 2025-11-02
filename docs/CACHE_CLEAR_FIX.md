# Cache Clear Fix

## Problem
The `clearProcessedCache()` function was not properly clearing all cache entries. This was due to a limitation in Google Apps Script's `CacheService`.

## Root Cause
**CacheService limitations:**
- There is **no way to list all keys** in the cache
- `removeAll()` requires an **array of specific keys** to remove
- There is **no global "clear everything" method**
- If the internal key tracking list (`cache:keylist`) gets out of sync, some cache entries won't be removed

## Solution

### 1. Improved `clearProcessedCache()` ✅
Enhanced the existing function with:
- **Batch processing**: Removes keys in batches of 50 (safer for CacheService limits)
- **Fallback handling**: If batch removal fails, falls back to individual removal
- **Better logging**: Shows progress and success rates
- **Return value**: Now returns an object with success status and metrics

```javascript
return { success: true, removed: 80, total: 85 };
```

### 2. New `forceClearCache()` 🚀
Added a nuclear option for when the key list is corrupted:
- Clears the key list itself
- Reads thread IDs from **Messages_Log** (last 1000 entries)
- Attempts to remove cache entries for all logged threads
- More aggressive than the standard clear function

**Use case:** When you suspect the cache key list is corrupted or out of sync.

```javascript
// In Apps Script editor, run:
forceClearCache();
```

### 3. New `rebuildCacheKeyList()` 🔧
Added a function to rebuild the tracking list:
- Scans **Messages_Log** for recent thread IDs (last 500)
- Checks which ones are actually still in cache
- Rebuilds the `cache:keylist` with only valid entries
- Useful for maintenance after force clear

```javascript
// In Apps Script editor, run:
rebuildCacheKeyList();
```

## How to Use

### Standard Clear (Recommended)
```javascript
clearProcessedCache();
// Logs: "Cache cleared successfully (85 of 85 thread(s) removed)"
```

### Force Clear (When Standard Fails)
```javascript
// 1. Force clear everything
forceClearCache();

// 2. Optional: Rebuild the key list
rebuildCacheKeyList();
```

### Check Cache Status
```javascript
getCacheStats();
// Returns: { ttl: 21600, cachedThreads: 42, ttlMinutes: 360, ttlHours: 6 }
```

## Technical Details

### CacheService Limitations
From Google's documentation:
- `get(key)` - Gets a single value
- `remove(key)` - Removes a single entry
- `removeAll(keys)` - Removes specific keys (requires array)
- **No `clearAll()` or pattern matching available**

### Our Approach
We maintain a **key tracking list** (`cache:keylist`) to know which keys exist:
- Updated whenever `markProcessed()` is called
- Used by `clearProcessedCache()` to know what to remove
- Can be rebuilt from `Messages_Log` if needed

### Batch Size
We use a batch size of **50 keys** for `removeAll()`:
- Safe limit for CacheService
- Prevents quota/timeout issues
- Falls back to individual removal if needed

## Testing

After pushing the code, test in the Apps Script editor:

```javascript
// 1. Check current cache
Logger.log(getCacheStats());

// 2. Clear cache
Logger.log(clearProcessedCache());

// 3. Verify cleared
Logger.log(getCacheStats());
```

## Notes

- **Cache entries expire automatically** after TTL (default 6 hours)
- If you can't clear the cache, you can just **wait for expiration**
- The key list is also subject to TTL and will eventually expire on its own
- `forceClearCache()` is more aggressive but requires Messages_Log data

## Related Files
- `/src/Cache.js` - All cache functions
- `/src/Code.js` - Contains `getSpreadsheet()` helper
- `/src/Config.js` - TTL configuration (`cache_ttl`)
- `/src/Logger.js` - Messages_Log writing

## Fixes Applied
- **v1.0** (2025-11-02): Initial implementation with improved batch clearing
- **v1.1** (2025-11-02): Fixed `getOrCreateSpreadsheet is not defined` error - changed to `getSpreadsheet()`

## References
- [Google Apps Script CacheService Documentation](https://developers.google.com/apps-script/reference/cache)
- [ChunkyCache Pattern](https://apps-script-snippets.contributor.pw/snippets/cache/chunky-cache/) - Advanced cache patterns for large objects
