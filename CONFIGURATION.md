# Example Configuration Guide

This guide shows you how to configure the Mythoria Email Engine for different use cases.

## Basic Configuration

### Minimal Setup (Rules Only)

If you don't want to use OpenAI, the engine can work with just the knowledge base:

1. Don't set `OPENAI_API_KEY`
2. Run `setup()`
3. Customize rules in the KnowledgeBase sheet

The engine will use only rule-based classification and create simple summaries from email snippets.

### Full Setup (Rules + AI)

For the best results, use both:

1. Set `OPENAI_API_KEY`
2. Run `setup()`
3. The engine will try rules first, then fall back to AI
4. AI will also generate summaries

## Example Knowledge Base Rules

### Customer Support Rules

```
Rule ID: SUPPORT_001
Priority: 100
Category: Support
Keywords: help, problem, issue, error, not working, broken, bug
Sender Pattern: 
Subject Pattern: 
Body Pattern: 
Action: label_support
Active: TRUE
```

```
Rule ID: SUPPORT_002
Priority: 95
Category: Support
Keywords: 
Sender Pattern: 
Subject Pattern: ^(help|support|problem|issue)
Body Pattern: 
Action: label_support
Active: TRUE
```

### Sales Rules

```
Rule ID: SALES_001
Priority: 90
Category: Sales
Keywords: price, pricing, cost, quote, purchase, buy, order
Sender Pattern: 
Subject Pattern: 
Body Pattern: 
Action: label_sales
Active: TRUE
```

```
Rule ID: SALES_002
Priority: 85
Category: Sales
Keywords: demo, trial, free trial, get started
Sender Pattern: 
Subject Pattern: 
Body Pattern: 
Action: label_sales
Active: TRUE
```

### Technical Support Rules

```
Rule ID: TECH_001
Priority: 85
Category: Technical
Keywords: api, integration, code, developer, documentation, endpoint
Sender Pattern: 
Subject Pattern: 
Body Pattern: 
Action: label_technical
Active: TRUE
```

```
Rule ID: TECH_002
Priority: 80
Category: Technical
Keywords: 
Sender Pattern: .*@(github\.com|stackoverflow\.com)
Subject Pattern: 
Body Pattern: 
Action: label_technical
Active: TRUE
```

### Priority Rules

```
Rule ID: URGENT_001
Priority: 100
Category: Urgent
Keywords: urgent, asap, emergency, critical, immediately
Sender Pattern: 
Subject Pattern: ^(urgent|emergency|critical)
Body Pattern: 
Action: label_urgent
Active: TRUE
```

```
Rule ID: LOW_001
Priority: 30
Category: Low Priority
Keywords: newsletter, unsubscribe, notification
Sender Pattern: 
Subject Pattern: newsletter|digest
Body Pattern: 
Action: label_lowpriority
Active: TRUE
```

### Domain-Specific Rules

```
Rule ID: PARTNER_001
Priority: 85
Category: Sales
Keywords: 
Sender Pattern: .*@(partner-company\.com|bigclient\.com)
Subject Pattern: 
Body Pattern: 
Action: label_sales
Active: TRUE
```

## Configuration Examples

### Example 1: High Volume Support Team

```javascript
// In Config.js
const CONFIG = {
  EMAIL_ADDRESS: 'support@mythoria.pt',
  BATCH_SIZE: 100,  // Process more emails
  TRIGGER_INTERVAL_MINUTES: 5,  // Check more frequently
  CONFIDENCE_THRESHOLD: 0.6,  // Lower threshold for more matches
  OPENAI_MODEL: 'gpt-3.5-turbo',  // Faster and cheaper
  OPENAI_MAX_TOKENS: 300
};
```

### Example 2: Sales Team with High Accuracy

```javascript
// In Config.js
const CONFIG = {
  EMAIL_ADDRESS: 'sales@mythoria.pt',
  BATCH_SIZE: 30,
  TRIGGER_INTERVAL_MINUTES: 15,
  CONFIDENCE_THRESHOLD: 0.8,  // Higher threshold for accuracy
  OPENAI_MODEL: 'gpt-4',  // Better quality
  OPENAI_MAX_TOKENS: 500
};
```

### Example 3: Cost-Conscious Setup

```javascript
// In Config.js
const CONFIG = {
  EMAIL_ADDRESS: 'hello@mythoria.pt',
  BATCH_SIZE: 50,
  TRIGGER_INTERVAL_MINUTES: 30,  // Less frequent
  CONFIDENCE_THRESHOLD: 0.7,
  OPENAI_MODEL: 'gpt-3.5-turbo',  // Cheaper
  OPENAI_MAX_TOKENS: 200,  // Fewer tokens
  // Or don't set OPENAI_API_KEY at all to use only rules
};
```

## Advanced Rule Patterns

### Using Regex Patterns

**Subject Pattern Examples:**

```javascript
// Match urgent emails
Subject Pattern: ^(urgent|emergency|asap)

// Match RE: or FW: emails
Subject Pattern: ^(re:|fw:)

// Match order numbers
Subject Pattern: order\s*#?\d+
```

**Sender Pattern Examples:**

```javascript
// Match specific domains
Sender Pattern: .*@(customer\.com|partner\.com)

// Match Gmail addresses
Sender Pattern: .*@gmail\.com

// Match personal emails (not corporate)
Sender Pattern: ^[^@]+@(gmail|yahoo|hotmail|outlook)\.com
```

**Body Pattern Examples:**

```javascript
// Match phone numbers
Body Pattern: \d{3}[-.]?\d{3}[-.]?\d{4}

// Match URLs
Body Pattern: https?://[^\s]+

// Match price mentions
Body Pattern: \$\d+|\d+\s*(dollar|euro|usd|eur)
```

### Multi-Criteria Rules

Combine multiple criteria for precise matching:

```
Rule ID: VIP_001
Priority: 100
Category: Sales
Keywords: partnership, enterprise, corporate
Sender Pattern: .*@(bigcorp|fortune500)\.com
Subject Pattern: 
Body Pattern: 
Action: label_urgent
Active: TRUE
```

## Testing Your Configuration

### Test Individual Components

```javascript
// Test knowledge base rules
const testEmail = {
  id: 'test',
  subject: 'Help! Problem with payment',
  from: 'customer@example.com',
  body: 'I need help with my payment issue',
  date: new Date()
};

const result = KnowledgeBase.classify(testEmail);
Logger.log(result);
```

### Test with Real Email

```javascript
// Process one email for testing
testProcessing()
```

### Monitor Results

1. Check the `Classifications` sheet to see which method was used
2. Review confidence scores
3. Adjust thresholds and rules based on results

## Performance Tuning

### For Speed

- Use `gpt-3.5-turbo` instead of `gpt-4`
- Reduce `OPENAI_MAX_TOKENS`
- Increase `BATCH_SIZE`
- Add more specific rules to reduce AI calls

### For Accuracy

- Use `gpt-4` model
- Increase `OPENAI_MAX_TOKENS`
- Set higher `CONFIDENCE_THRESHOLD`
- Add more detailed rules with multiple criteria

### For Cost Savings

- Don't set `OPENAI_API_KEY` (rules only)
- Use `gpt-3.5-turbo` instead of `gpt-4`
- Reduce `OPENAI_MAX_TOKENS`
- Add comprehensive rules to minimize AI usage

## Monitoring and Optimization

### Weekly Review

1. Check `Classifications` sheet for accuracy
2. Look for patterns in misclassifications
3. Add new rules based on common patterns
4. Adjust confidence thresholds

### Monthly Review

1. Analyze processing statistics
2. Review OpenAI costs
3. Optimize rules for efficiency
4. Update categories if needed

## Common Patterns

### Autoresponder Detection

```
Keywords: auto-reply, automatic, out of office, vacation
Sender Pattern: (noreply|no-reply|donotreply)@
Action: label_lowpriority
```

### Newsletter Detection

```
Keywords: newsletter, unsubscribe, digest, weekly update
Subject Pattern: newsletter|digest
Body Pattern: unsubscribe
Action: label_lowpriority
```

### Security Alert Detection

```
Keywords: security, password, login attempt, suspicious
Subject Pattern: security alert|password reset
Category: Urgent
Action: label_urgent
```

## Tips

1. **Start Simple**: Begin with broad rules, then refine
2. **Use Priority**: Higher priority rules match first
3. **Test Patterns**: Use regex101.com to test patterns
4. **Monitor Logs**: Check the Logs sheet regularly
5. **Iterate**: Continuously improve rules based on results
6. **Balance**: Mix rules and AI for best results

## Need Help?

- Check the main README.md for troubleshooting
- Review the Logs sheet for errors
- Test rules individually before deploying
- Start with default rules and customize gradually
