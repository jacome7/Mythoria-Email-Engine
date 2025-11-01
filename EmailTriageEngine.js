/**
 * Email Triage Engine - Main processing logic
 */

const EmailTriageEngine = {
  /**
   * Process unread emails
   */
  processUnreadEmails: function() {
    logMessage('INFO', 'Starting email triage process');
    
    try {
      // Initialize configuration
      initializeConfig();
      
      // Get unread emails for monitored address
      const query = `to:${CONFIG.EMAIL_ADDRESS} is:unread`;
      const threads = GmailApp.search(query, 0, CONFIG.BATCH_SIZE);
      
      logMessage('INFO', `Found ${threads.length} unread email threads`);
      
      if (threads.length === 0) {
        return { processed: 0, skipped: 0, errors: 0 };
      }
      
      let processed = 0;
      let skipped = 0;
      let errors = 0;
      
      for (let thread of threads) {
        const messages = thread.getMessages();
        
        for (let message of messages) {
          if (!message.isUnread()) {
            continue;
          }
          
          try {
            const result = this.processEmail(message);
            
            if (result.success) {
              processed++;
            } else {
              skipped++;
            }
          } catch (e) {
            errors++;
            logMessage('ERROR', 'Failed to process email', {
              emailId: message.getId(),
              error: e.message
            });
          }
        }
      }
      
      logMessage('INFO', 'Email triage process completed', {
        processed: processed,
        skipped: skipped,
        errors: errors
      });
      
      return { processed, skipped, errors };
      
    } catch (e) {
      logMessage('ERROR', 'Email triage process failed', { error: e.message });
      throw e;
    }
  },
  
  /**
   * Process a single email
   */
  processEmail: function(message) {
    const emailId = message.getId();
    
    // Check if already processed
    if (SheetsService.isEmailProcessed(emailId)) {
      logMessage('INFO', 'Email already processed, skipping', { emailId: emailId });
      return { success: false, reason: 'already_processed' };
    }
    
    // Check if email is for monitored address
    if (!isMonitoredEmail(message)) {
      logMessage('INFO', 'Email not for monitored address, skipping', { emailId: emailId });
      return { success: false, reason: 'not_monitored' };
    }
    
    // Extract email data
    const emailData = {
      id: emailId,
      threadId: message.getThread().getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      to: message.getTo(),
      date: message.getDate(),
      body: cleanEmailContent(message.getPlainBody()),
      isUnread: message.isUnread(),
      labels: []
    };
    
    logMessage('INFO', 'Processing email', {
      emailId: emailId,
      subject: emailData.subject,
      from: emailData.from
    });
    
    // Step 1: Try knowledge base classification first
    let classification = KnowledgeBase.classify(emailData);
    
    // Step 2: If knowledge base doesn't match, use OpenAI
    if (!classification && CONFIG.OPENAI_API_KEY) {
      try {
        classification = retryWithBackoff(() => OpenAIService.classify(emailData), 2, 2000);
      } catch (e) {
        logMessage('WARN', 'OpenAI classification failed, using fallback', { error: e.message });
        classification = {
          category: 'General',
          confidence: 0.5,
          method: 'fallback',
          reasoning: 'Classification failed, defaulting to General'
        };
      }
    } else if (!classification) {
      // Fallback if no OpenAI key
      classification = {
        category: 'General',
        confidence: 0.5,
        method: 'fallback',
        reasoning: 'No classification method available'
      };
    }
    
    // Step 3: Get summary if OpenAI is available
    let summary = { summary: '', keyPoints: [], sentiment: 'Neutral' };
    if (CONFIG.OPENAI_API_KEY) {
      try {
        summary = retryWithBackoff(() => OpenAIService.summarize(emailData), 2, 2000);
      } catch (e) {
        logMessage('WARN', 'OpenAI summarization failed', { error: e.message });
        summary.summary = truncateText(emailData.body, 200);
      }
    } else {
      summary.summary = truncateText(emailData.body, 200);
    }
    
    // Step 4: Apply labels
    const labels = this.applyLabels(message, classification);
    emailData.labels = labels;
    
    // Step 5: Save results
    SheetsService.saveClassification(
      emailId,
      classification.category,
      classification.confidence,
      classification.method,
      classification.reasoning
    );
    
    SheetsService.saveSummary(
      emailId,
      summary.summary,
      summary.keyPoints.join('; '),
      summary.sentiment
    );
    
    SheetsService.saveProcessedEmail({
      id: emailId,
      threadId: emailData.threadId,
      subject: emailData.subject,
      from: emailData.from,
      date: emailData.date,
      classification: classification.category,
      confidence: classification.confidence,
      summary: summary.summary,
      labels: labels
    });
    
    // Step 6: Mark as read
    message.markRead();
    
    logMessage('INFO', 'Email processed successfully', {
      emailId: emailId,
      category: classification.category,
      confidence: classification.confidence
    });
    
    return { success: true, classification, summary };
  },
  
  /**
   * Apply Gmail labels based on classification
   */
  applyLabels: function(message, classification) {
    const appliedLabels = [];
    
    // Get or create processed label
    const processedLabel = this.getOrCreateLabel(CONFIG.LABELS.PROCESSED);
    message.getThread().addLabel(processedLabel);
    appliedLabels.push(CONFIG.LABELS.PROCESSED);
    
    // Apply category label
    let categoryLabel = null;
    switch(classification.category.toLowerCase()) {
      case 'support':
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.SUPPORT);
        break;
      case 'sales':
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.SALES);
        break;
      case 'technical':
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.TECHNICAL);
        break;
      case 'urgent':
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.URGENT);
        break;
      case 'low priority':
      case 'lowpriority':
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.LOW_PRIORITY);
        break;
      default:
        categoryLabel = this.getOrCreateLabel(CONFIG.LABELS.GENERAL);
    }
    
    if (categoryLabel) {
      message.getThread().addLabel(categoryLabel);
      appliedLabels.push(categoryLabel.getName());
    }
    
    return appliedLabels;
  },
  
  /**
   * Get or create Gmail label
   */
  getOrCreateLabel: function(labelName) {
    let label = GmailApp.getUserLabelByName(labelName);
    
    if (!label) {
      // Check if parent label exists for nested labels
      const parts = labelName.split('/');
      if (parts.length > 1) {
        let parentLabel = null;
        for (let i = 0; i < parts.length - 1; i++) {
          const parentName = parts.slice(0, i + 1).join('/');
          parentLabel = GmailApp.getUserLabelByName(parentName);
          if (!parentLabel) {
            parentLabel = GmailApp.createLabel(parentName);
          }
        }
      }
      label = GmailApp.createLabel(labelName);
      logMessage('INFO', `Created label: ${labelName}`);
    }
    
    return label;
  }
};
