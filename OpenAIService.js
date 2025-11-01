/**
 * OpenAI Service for AI-powered classification and summarization
 */

const OpenAIService = {
  /**
   * Call OpenAI API
   */
  callAPI: function(prompt, systemMessage) {
    if (!CONFIG.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const messages = [
      {
        role: 'system',
        content: systemMessage || 'You are a helpful email classification assistant.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const payload = {
      model: CONFIG.OPENAI_MODEL,
      messages: messages,
      max_tokens: CONFIG.OPENAI_MAX_TOKENS,
      temperature: 0.3
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      if (responseCode !== 200) {
        throw new Error(`OpenAI API error: ${responseCode} - ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response from OpenAI');
      }
    } catch (e) {
      logMessage('ERROR', 'OpenAI API call failed', { error: e.message });
      throw e;
    }
  },
  
  /**
   * Classify email using OpenAI
   */
  classify: function(emailData) {
    const systemMessage = `You are an email classification expert. Classify emails into one of these categories: Support, Sales, Technical, General, Urgent, or Low Priority.
    
Return your response as a JSON object with the following structure:
{
  "category": "category name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;
    
    const prompt = `Classify the following email:

Subject: ${emailData.subject}
From: ${emailData.from}
Date: ${emailData.date}

Body:
${truncateText(emailData.body, 2000)}

Classify this email and provide your response as JSON.`;
    
    try {
      const response = this.callAPI(prompt, systemMessage);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        
        logMessage('INFO', 'OpenAI classification successful', {
          emailId: emailData.id,
          category: classification.category
        });
        
        return {
          category: classification.category,
          confidence: classification.confidence || 0.8,
          method: 'openai',
          reasoning: classification.reasoning || ''
        };
      } else {
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (e) {
      logMessage('ERROR', 'OpenAI classification failed', { error: e.message });
      throw e;
    }
  },
  
  /**
   * Summarize email using OpenAI
   */
  summarize: function(emailData) {
    const systemMessage = `You are an expert at summarizing emails concisely. Provide a brief summary (2-3 sentences), key points (bullet points), and sentiment (Positive, Neutral, or Negative).

Return your response as a JSON object with the following structure:
{
  "summary": "brief summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "Positive|Neutral|Negative"
}`;
    
    const prompt = `Summarize the following email:

Subject: ${emailData.subject}
From: ${emailData.from}
Date: ${emailData.date}

Body:
${truncateText(emailData.body, 3000)}

Provide a summary with key points and sentiment as JSON.`;
    
    try {
      const response = this.callAPI(prompt, systemMessage);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const summary = JSON.parse(jsonMatch[0]);
        
        logMessage('INFO', 'OpenAI summarization successful', {
          emailId: emailData.id
        });
        
        return {
          summary: summary.summary || '',
          keyPoints: summary.keyPoints || [],
          sentiment: summary.sentiment || 'Neutral'
        };
      } else {
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (e) {
      logMessage('ERROR', 'OpenAI summarization failed', { error: e.message });
      return {
        summary: truncateText(emailData.body, 200),
        keyPoints: [],
        sentiment: 'Neutral'
      };
    }
  },
  
  /**
   * Test OpenAI connection
   */
  testConnection: function() {
    try {
      const response = this.callAPI('Say "Hello, Mythoria!"', 'You are a helpful assistant.');
      logMessage('INFO', 'OpenAI connection test successful', { response: response });
      return true;
    } catch (e) {
      logMessage('ERROR', 'OpenAI connection test failed', { error: e.message });
      return false;
    }
  }
};
