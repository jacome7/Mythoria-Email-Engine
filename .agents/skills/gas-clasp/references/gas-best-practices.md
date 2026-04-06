# Google Apps Script (GAS) Best Practices

Google Apps Script best practices focus on three main pillars: **performance**, **security**, and **development workflow**.

## 1. Performance & Optimization

The most common cause of slow scripts is excessive calls to Google services (Sheets, Drive, etc.).

*   **Batch Operations:** Never use `getValue()` or `setValue()` inside a loop. Instead, use `getValues()` to read an entire range into a 2D JavaScript array, process it in memory, and use `setValues()` to write it back in one call.
*   **Minimize Service Calls:** Every call to a service like `SpreadsheetApp` or `DriveApp` is an API request with network overhead. Perform as much logic as possible using native JavaScript.
*   **Use the Cache Service:** Store frequently accessed data (like API responses or configuration) in `CacheService` to avoid redundant fetching.
*   **Avoid Libraries in UI-Heavy Scripts:** Libraries increase startup time. For Add-ons or Web Apps with many `google.script.run` calls, libraries can make the UI feel sluggish.

## 2. Security & Data Protection

*   **Never Hardcode Secrets:** Do not put API keys or passwords directly in your code. Use `PropertiesService.getScriptProperties()` to store them.
*   **Principle of Least Privilege:** Use the `@OnlyCurrentDoc` JSDoc annotation if your script only needs access to the file it's bound to. This limits the scope of permissions requested from the user.
*   **Explicit Scopes:** For professional projects, manually define your OAuth scopes in the `appsscript.json` manifest file to ensure you aren't requesting more access than necessary.
*   **Validate User Input:** Always sanitize data coming from `HtmlService` or external webhooks to prevent injection attacks.

## 3. Handling Quotas & Timeouts

*   **6-Minute Limit:** Standard scripts have a 6-minute execution limit. If your task is longer, use **Triggers** to "chain" executions. Save your progress in Script Properties and set a time-based trigger to resume where you left off.
*   **Lock Service:** If multiple users or triggers might run the same script simultaneously (e.g., writing to the same row), use `LockService` to prevent data collisions and race conditions.