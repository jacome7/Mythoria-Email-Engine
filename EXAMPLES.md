# Knowledge Base Examples

This file contains example rules for the Knowledge Base sheet to help you get started with custom classifications.

## How to Use

1. Open your Google Sheets (the one created by `createNewSpreadsheet()`)
2. Go to the "KnowledgeBase" sheet
3. Copy these examples or add your own rules
4. Set Active to TRUE to enable a rule

## Rule Structure

| Column | Description | Example |
|--------|-------------|---------|
| Rule ID | Unique identifier | RULE_001 |
| Priority | 0-100, higher = first | 100 |
| Category | Classification category | Support |
| Keywords | Comma-separated list | help, issue, problem |
| Sender Pattern | Regex for sender email | .*@customer\.com |
| Subject Pattern | Regex for subject | ^urgent |
| Body Pattern | Regex for body content | order\s*#\d+ |
| Action | Action to take | label_support |
| Active | TRUE or FALSE | TRUE |

## Default Rules

These are automatically created by `setup()`:

### Support Rules

```
RULE_001, 100, Support, help, issue, problem, error, bug, support, assist, , , , label_support, TRUE
```

### Sales Rules

```
RULE_002, 90, Sales, price, quote, purchase, buy, order, payment, invoice, , , , label_sales, TRUE
```

### Technical Rules

```
RULE_003, 85, Technical, api, integration, technical, code, developer, documentation, , , , label_technical, TRUE
```

### General Rules

```
RULE_004, 50, General, inquiry, question, information, general, , , , label_general, TRUE
```

### Urgent Rules

```
RULE_005, 95, Urgent, urgent, asap, emergency, critical, immediate, , urgent|asap|emergency, , label_urgent, TRUE
```

## Custom Rule Examples

### E-commerce Rules

**Order Confirmation**
```
Rule ID: ECOM_001
Priority: 90
Category: Sales
Keywords: order, confirmation, purchase, thank you
Sender Pattern: 
Subject Pattern: order\s*(confirmation|receipt|#\d+)
Body Pattern: 
Action: label_sales
Active: TRUE
```

**Refund Request**
```
Rule ID: ECOM_002
Priority: 95
Category: Support
Keywords: refund, return, money back, cancellation
Sender Pattern: 
Subject Pattern: refund|return
Body Pattern: 
Action: label_support
Active: TRUE
```

**Shipping Inquiry**
```
Rule ID: ECOM_003
Priority: 80
Category: Support
Keywords: shipping, delivery, tracking, where is my order
Sender Pattern: 
Subject Pattern: 
Body Pattern: tracking|shipment|delivery
Action: label_support
Active: TRUE
```

### SaaS Product Rules

**Trial Signup**
```
Rule ID: SAAS_001
Priority: 90
Category: Sales
Keywords: trial, sign up, getting started, demo
Sender Pattern: 
Subject Pattern: trial|demo|getting started
Body Pattern: 
Action: label_sales
Active: TRUE
```

**API Integration**
```
Rule ID: SAAS_002
Priority: 85
Category: Technical
Keywords: api, integration, webhook, endpoint, authentication
Sender Pattern: 
Subject Pattern: api|integration
Body Pattern: 
Action: label_technical
Active: TRUE
```

**Billing Issue**
```
Rule ID: SAAS_003
Priority: 95
Category: Support
Keywords: billing, payment failed, credit card, subscription
Sender Pattern: 
Subject Pattern: billing|payment|subscription
Body Pattern: 
Action: label_urgent
Active: TRUE
```

**Feature Request**
```
Rule ID: SAAS_004
Priority: 60
Category: General
Keywords: feature, request, suggestion, enhancement, would like
Sender Pattern: 
Subject Pattern: feature|suggestion|enhancement
Body Pattern: 
Action: label_general
Active: TRUE
```

### Customer Support Rules

**Password Reset**
```
Rule ID: SUPPORT_001
Priority: 85
Category: Support
Keywords: password, reset, forgot, login, access
Sender Pattern: 
Subject Pattern: password|reset|login
Body Pattern: 
Action: label_support
Active: TRUE
```

**Account Locked**
```
Rule ID: SUPPORT_002
Priority: 95
Category: Support
Keywords: locked, blocked, suspended, disabled, cannot access
Sender Pattern: 
Subject Pattern: locked|blocked|suspended
Body Pattern: 
Action: label_urgent
Active: TRUE
```

**How-to Question**
```
Rule ID: SUPPORT_003
Priority: 70
Category: Support
Keywords: how to, how do i, help me, guide, tutorial
Sender Pattern: 
Subject Pattern: ^how\s+(to|do|can)
Body Pattern: 
Action: label_support
Active: TRUE
```

### VIP Customer Rules

**Enterprise Clients**
```
Rule ID: VIP_001
Priority: 100
Category: Sales
Keywords: 
Sender Pattern: .*@(bigcorp|enterprise|fortune500)\.com
Subject Pattern: 
Body Pattern: 
Action: label_urgent
Active: TRUE
```

**Partner Communications**
```
Rule ID: VIP_002
Priority: 95
Category: Sales
Keywords: partnership, collaboration, joint venture
Sender Pattern: .*@partner\.com
Subject Pattern: 
Body Pattern: 
Action: label_sales
Active: TRUE
```

### Marketing Rules

**Newsletter Signups**
```
Rule ID: MARKETING_001
Priority: 50
Category: General
Keywords: subscribe, newsletter, updates, mailing list
Sender Pattern: 
Subject Pattern: newsletter|subscribe
Body Pattern: 
Action: label_lowpriority
Active: TRUE
```

**Unsubscribe Requests**
```
Rule ID: MARKETING_002
Priority: 70
Category: General
Keywords: unsubscribe, opt out, remove me, stop sending
Sender Pattern: 
Subject Pattern: unsubscribe
Body Pattern: unsubscribe
Action: label_general
Active: TRUE
```

### Spam and Auto-Reply Rules

**Auto-Reply Detection**
```
Rule ID: SPAM_001
Priority: 100
Category: Low Priority
Keywords: auto-reply, automatic reply, out of office, vacation
Sender Pattern: (noreply|no-reply|donotreply)@
Subject Pattern: ^(auto|automatic|out of office)
Body Pattern: 
Action: label_lowpriority
Active: TRUE
```

**Bounce Messages**
```
Rule ID: SPAM_002
Priority: 100
Category: Low Priority
Keywords: delivery failed, undeliverable, mail delivery
Sender Pattern: mailer-daemon@|postmaster@
Subject Pattern: delivery failed|undeliverable
Body Pattern: 
Action: label_lowpriority
Active: TRUE
```

### Security Rules

**Security Alerts**
```
Rule ID: SECURITY_001
Priority: 100
Category: Urgent
Keywords: security, breach, unauthorized, suspicious activity, alert
Sender Pattern: 
Subject Pattern: security|breach|unauthorized
Body Pattern: 
Action: label_urgent
Active: TRUE
```

**Password Reset Requests**
```
Rule ID: SECURITY_002
Priority: 90
Category: Support
Keywords: 
Sender Pattern: 
Subject Pattern: password reset|reset password
Body Pattern: 
Action: label_support
Active: TRUE
```

## Pattern Examples

### Subject Patterns

```javascript
// Starts with "Urgent"
^urgent

// Contains "invoice" or "receipt"
(invoice|receipt)

// Order number (#123, #456, etc.)
order\s*#?\d+

// RE: or FW: emails
^(re:|fw:)

// Question format
\?$
```

### Sender Patterns

```javascript
// Specific domain
.*@mythoria\.com

// Multiple domains
.*@(gmail|yahoo|hotmail)\.com

// Corporate domains (not free email)
^[^@]+@(?!(gmail|yahoo|hotmail))

// Noreply addresses
(noreply|no-reply|donotreply)@
```

### Body Patterns

```javascript
// Phone numbers
\d{3}[-.]?\d{3}[-.]?\d{4}

// URLs
https?://[^\s]+

// Price mentions
\$\d+|\d+\s*(dollar|euro|usd)

// Email addresses
[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}

// Credit card numbers (be careful with PII)
\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}
```

## Priority Guidelines

- **100**: Critical/Security/VIP (process first)
- **90-95**: High priority (urgent, important customers)
- **80-89**: Standard priority (regular support, sales)
- **70-79**: Medium priority (general inquiries)
- **50-69**: Low-medium priority (feature requests)
- **30-49**: Low priority (newsletters, notifications)
- **0-29**: Very low priority (spam, auto-replies)

## Testing Rules

After adding rules:

1. Send test emails or use existing ones
2. Run `testProcessing()` in Apps Script
3. Check the Classifications sheet
4. Verify the confidence scores
5. Adjust keywords/patterns as needed

## Tips

1. **Start Broad**: Begin with general rules, then add specific ones
2. **Use Priority**: Higher priority rules match first
3. **Test Patterns**: Use regex101.com to test regex patterns
4. **Monitor Results**: Check Classifications sheet regularly
5. **Iterate**: Refine rules based on actual email patterns
6. **Combine Criteria**: Use multiple fields for precision
7. **Document**: Add notes about why you created each rule

## Common Mistakes

❌ **Too specific**: Rule matches nothing
✅ **Balanced**: Covers common variations

❌ **No priority**: All rules have same priority
✅ **Prioritized**: Important rules run first

❌ **Typos in regex**: Pattern doesn't match
✅ **Tested**: Patterns verified before use

❌ **Inactive rules**: Set Active to FALSE by mistake
✅ **Enabled**: Active = TRUE for rules in use

## Need Help?

- Review CONFIGURATION.md for more examples
- Check the Logs sheet for rule matching details
- Test patterns at https://regex101.com
- Start with default rules and customize gradually

---

**Last Updated**: November 2025
