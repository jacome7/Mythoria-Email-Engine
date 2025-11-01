/**
 * Knowledge Base Service for rules-based classification
 */

const KnowledgeBase = {
  /**
   * Classify email using knowledge base rules
   */
  classify: function(emailData) {
    const rules = SheetsService.getKnowledgeBaseRules();
    
    if (rules.length === 0) {
      logMessage('WARN', 'No knowledge base rules found');
      return null;
    }
    
    const emailText = `${emailData.subject} ${emailData.from} ${emailData.body}`.toLowerCase();
    
    // Try to match each rule
    for (let rule of rules) {
      const match = this.matchRule(rule, emailData, emailText);
      
      if (match.matched) {
        logMessage('INFO', `Email matched rule: ${rule.id}`, {
          emailId: emailData.id,
          rule: rule.category,
          confidence: match.confidence
        });
        
        return {
          category: rule.category,
          confidence: match.confidence,
          method: 'knowledge_base',
          ruleId: rule.id,
          reasoning: match.reasoning
        };
      }
    }
    
    return null;
  },
  
  /**
   * Check if email matches a rule
   */
  matchRule: function(rule, emailData, emailText) {
    let score = 0;
    let maxScore = 0;
    const reasons = [];
    
    // Check keywords
    if (rule.keywords && rule.keywords.length > 0) {
      maxScore += 30;
      const keywordMatches = rule.keywords.filter(keyword => 
        emailText.includes(keyword.toLowerCase())
      );
      const keywordScore = (keywordMatches.length / rule.keywords.length) * 30;
      score += keywordScore;
      
      if (keywordMatches.length > 0) {
        reasons.push(`Keywords matched: ${keywordMatches.join(', ')}`);
      }
    }
    
    // Check sender pattern
    if (rule.senderPattern) {
      maxScore += 25;
      const senderPattern = new RegExp(rule.senderPattern, 'i');
      if (senderPattern.test(emailData.from)) {
        score += 25;
        reasons.push(`Sender matches pattern: ${rule.senderPattern}`);
      }
    }
    
    // Check subject pattern
    if (rule.subjectPattern) {
      maxScore += 25;
      const subjectPattern = new RegExp(rule.subjectPattern, 'i');
      if (subjectPattern.test(emailData.subject)) {
        score += 25;
        reasons.push(`Subject matches pattern: ${rule.subjectPattern}`);
      }
    }
    
    // Check body pattern
    if (rule.bodyPattern) {
      maxScore += 20;
      const bodyPattern = new RegExp(rule.bodyPattern, 'i');
      if (bodyPattern.test(emailData.body)) {
        score += 20;
        reasons.push(`Body matches pattern: ${rule.bodyPattern}`);
      }
    }
    
    const confidence = maxScore > 0 ? score / maxScore : 0;
    const matched = confidence >= CONFIG.CONFIDENCE_THRESHOLD;
    
    return {
      matched: matched,
      confidence: confidence,
      reasoning: reasons.join('; ')
    };
  },
  
  /**
   * Get default rules (if sheet is empty)
   */
  getDefaultRules: function() {
    return [
      {
        id: 'RULE_001',
        priority: 100,
        category: 'Support',
        keywords: ['help', 'issue', 'problem', 'error', 'bug', 'support', 'assist'],
        senderPattern: '',
        subjectPattern: '',
        bodyPattern: '',
        action: 'label_support',
        active: true
      },
      {
        id: 'RULE_002',
        priority: 90,
        category: 'Sales',
        keywords: ['price', 'quote', 'purchase', 'buy', 'order', 'payment', 'invoice'],
        senderPattern: '',
        subjectPattern: '',
        bodyPattern: '',
        action: 'label_sales',
        active: true
      },
      {
        id: 'RULE_003',
        priority: 85,
        category: 'Technical',
        keywords: ['api', 'integration', 'technical', 'code', 'developer', 'documentation'],
        senderPattern: '',
        subjectPattern: '',
        bodyPattern: '',
        action: 'label_technical',
        active: true
      },
      {
        id: 'RULE_004',
        priority: 50,
        category: 'General',
        keywords: ['inquiry', 'question', 'information', 'general'],
        senderPattern: '',
        subjectPattern: '',
        bodyPattern: '',
        action: 'label_general',
        active: true
      },
      {
        id: 'RULE_005',
        priority: 95,
        category: 'Urgent',
        keywords: ['urgent', 'asap', 'emergency', 'critical', 'immediate'],
        senderPattern: '',
        subjectPattern: 'urgent|asap|emergency',
        bodyPattern: '',
        action: 'label_urgent',
        active: true
      }
    ];
  },
  
  /**
   * Populate knowledge base with default rules
   */
  populateDefaultRules: function() {
    const rules = this.getDefaultRules();
    const sheet = SheetsService.getSheet(CONFIG.SHEETS.KNOWLEDGE_BASE);
    
    rules.forEach(rule => {
      SheetsService.appendToSheet(CONFIG.SHEETS.KNOWLEDGE_BASE, [
        rule.id,
        rule.priority,
        rule.category,
        rule.keywords.join(', '),
        rule.senderPattern,
        rule.subjectPattern,
        rule.bodyPattern,
        rule.action,
        rule.active
      ]);
    });
    
    logMessage('INFO', 'Default rules populated in knowledge base');
  }
};
