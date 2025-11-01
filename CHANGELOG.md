# Changelog

All notable changes to the Mythoria Email Engine project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-01

### Added
- Initial release of Mythoria Email Engine
- Automated email triage for hello@mythoria.pt
- Rules-based classification using Knowledge Base
- AI-powered classification using OpenAI GPT-4
- AI-powered email summarization with key points and sentiment
- Automatic Gmail label application
- Google Sheets integration for data persistence
- Time-driven triggers (runs every 15 minutes)
- Comprehensive configuration management
- Retry logic with exponential backoff
- Detailed logging system
- Five data sheets: ProcessedEmails, KnowledgeBase, Classifications, Summaries, Logs
- Dual classification system (rules first, then AI fallback)
- Support for multiple email categories: Support, Sales, Technical, General, Urgent, Low Priority
- clasp support for development and deployment
- Complete documentation suite:
  - README.md - Main documentation
  - QUICKSTART.md - 5-minute setup guide
  - CONFIGURATION.md - Configuration examples
  - DEPLOYMENT.md - Production deployment guide
  - CONTRIBUTING.md - Contribution guidelines
- MIT License
- Package.json with clasp scripts
- .gitignore for security
- Default knowledge base rules
- Script Properties support for secure configuration
- Manual and automatic processing modes
- Test functions for validation

### Security
- Script Properties for API key storage
- OAuth scope management
- No hardcoded credentials
- Secure API communication

### Documentation
- Comprehensive README with full setup instructions
- Quick start guide for rapid deployment
- Configuration examples and patterns
- Production deployment checklist
- Contributing guidelines
- Troubleshooting tips
- Architecture overview
- API documentation

### Components
- Code.js - Main entry point and trigger functions
- EmailTriageEngine.js - Core email processing logic
- KnowledgeBase.js - Rules-based classification
- OpenAIService.js - AI classification and summarization
- SheetsService.js - Google Sheets data persistence
- Config.js - Configuration management
- Utils.js - Helper utilities and common functions
- appsscript.json - Apps Script manifest
- package.json - Node.js package configuration

### Features
- Process up to 50 emails per batch
- Configurable batch size
- Configurable trigger interval
- Confidence threshold for rule matching
- Support for regex patterns in rules
- Keyword matching with priority
- Email metadata extraction
- Text cleaning and normalization
- Similarity calculation
- Automatic label creation
- Thread-aware processing
- Unread email filtering
- Duplicate prevention
- Error handling and recovery

## [Unreleased]

### Planned
- Web dashboard for monitoring
- Email notifications for urgent items
- Custom action support
- Multi-language support
- Advanced analytics
- Integration with other services
- Webhook support
- Machine learning model training
- A/B testing for classification methods
- Performance metrics dashboard

---

## Version History

### Version 1.0.0 (2025-11-01)
- Initial public release
- Core functionality complete
- Production-ready
- Full documentation

---

## Notes

- See README.md for setup instructions
- See DEPLOYMENT.md for production deployment
- See CONTRIBUTING.md for contribution guidelines
