# Contributing to Mythoria Email Engine

Thank you for your interest in contributing to the Mythoria Email Engine! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Log excerpts from the Logs sheet
- Apps Script execution logs

### Suggesting Enhancements

We welcome suggestions! Please create an issue with:
- Clear description of the enhancement
- Use case and benefits
- Examples of how it would work
- Any implementation ideas

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Login to clasp: `npm run login`
4. Create or link Apps Script project
5. Push code: `npm run push`

## Code Style

### JavaScript

- Use ES5+ syntax (Apps Script supports modern JS)
- Use camelCase for variables and functions
- Use PascalCase for classes and objects
- Use UPPERCASE for constants
- Add JSDoc comments for functions
- Keep functions focused and small
- Use descriptive variable names

### Example:

```javascript
/**
 * Process a single email message
 * @param {GmailMessage} message - The Gmail message to process
 * @returns {Object} Processing result with success status
 */
function processEmail(message) {
  const emailId = message.getId();
  
  if (SheetsService.isEmailProcessed(emailId)) {
    return { success: false, reason: 'already_processed' };
  }
  
  // ... rest of function
}
```

## Testing

Before submitting:

1. Test with real emails
2. Verify all functions work
3. Check logs for errors
4. Test with and without OpenAI
5. Verify sheets are updated correctly
6. Test trigger setup and execution

### Manual Testing

```javascript
// Test single email
testProcessing()

// Test configuration
getConfigStatus()

// Test OpenAI
OpenAIService.testConnection()

// Test knowledge base
KnowledgeBase.classify(testEmailData)
```

## Documentation

- Update README.md for major changes
- Add examples to CONFIGURATION.md for new features
- Update DEPLOYMENT.md for deployment changes
- Add JSDoc comments to new functions
- Keep documentation clear and concise

## Adding New Features

### 1. Classification Methods

To add a new classification method:

1. Create a new service file (e.g., `NewClassifier.js`)
2. Implement `classify(emailData)` function
3. Return standardized result:
   ```javascript
   {
     category: 'CategoryName',
     confidence: 0.85,
     method: 'new_method',
     reasoning: 'Why this classification'
   }
   ```
4. Update `EmailTriageEngine.js` to use new method
5. Document in README.md

### 2. Data Storage

To add new sheet:

1. Add sheet name to `CONFIG.SHEETS` in `Config.js`
2. Add initialization in `SheetsService.initializeSheet()`
3. Create save function in `SheetsService`
4. Document structure in README.md

### 3. Email Actions

To add new action:

1. Add action function to `EmailTriageEngine.js`
2. Update knowledge base action types
3. Test thoroughly
4. Document in CONFIGURATION.md

## Code Review Checklist

- [ ] Code follows project style
- [ ] Functions have JSDoc comments
- [ ] No hardcoded credentials
- [ ] Error handling in place
- [ ] Logging added for debugging
- [ ] Tested with real data
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Security

- Never commit API keys or credentials
- Use Script Properties for sensitive data
- Validate all inputs
- Sanitize data before storage
- Review OAuth scopes needed
- Follow least privilege principle

## Performance

- Keep functions efficient
- Avoid unnecessary API calls
- Use batch operations when possible
- Cache data when appropriate
- Consider Apps Script quotas
- Monitor execution time

## Common Gotchas

### Apps Script Limitations

- 6 minute execution time limit
- Daily quota limits
- Rate limiting on external APIs
- No npm packages (pure JavaScript only)
- Different from Node.js environment

### Gmail API

- Label hierarchy requires parent creation
- Messages vs. Threads distinction
- Rate limits on API calls
- Batch operations when possible

### OpenAI API

- Rate limits
- Token limits
- Cost per request
- Response parsing can fail

## Versioning

We use Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features, backwards compatible
- PATCH: Bug fixes

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release

## Questions?

- Open an issue for questions
- Check existing documentation
- Review code examples
- Test in sandbox environment first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!

---

**Happy Coding!** 🚀
