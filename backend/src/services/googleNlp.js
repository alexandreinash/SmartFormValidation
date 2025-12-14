let client = null;

// Lazily require Google NLP client only when AI is enabled to avoid module issues
function getClient() {
  if (!client) {
    // Uses Google Cloud credentials from GOOGLE_APPLICATION_CREDENTIALS env var.
    // eslint-disable-next-line global-require
    const { LanguageServiceClient } = require('@google-cloud/language');
    const path = require('path');
    const fs = require('fs');
    
    // Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      // Handle both absolute and relative paths
      const fullPath = path.isAbsolute(credPath) 
        ? credPath 
        : path.resolve(__dirname, '..', '..', credPath);
      
      if (fs.existsSync(fullPath)) {
        // Set the environment variable to the absolute path
        // This ensures the Google Cloud library can find it
        process.env.GOOGLE_APPLICATION_CREDENTIALS = fullPath;
        console.log('✅ Google NLP credentials path set to:', fullPath);
      } else {
        console.error('❌ Google NLP credentials file not found:', fullPath);
        throw new Error(`Credentials file not found: ${fullPath}`);
      }
    } else {
      console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS not set');
    }
    
    // Create client - it will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
    try {
      client = new LanguageServiceClient();
      console.log('✅ Google NLP client initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize Google NLP client:', err.message);
      throw err;
    }
  }
  return client;
}

async function analyzeSentiment(text) {
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    // AI disabled: behave like a no-op
    return { score: 0.0, magnitude: 0.0 };
  }

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await getClient().analyzeSentiment({ document });
  const sentiment = result.documentSentiment || { score: 0.0, magnitude: 0.0 };

  return {
    score: sentiment.score,
    magnitude: sentiment.magnitude,
  };
}

async function analyzeEntities(text) {
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    return { entities: [] };
  }

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await getClient().analyzeEntities({ document });

  return {
    entities: (result.entities || []).map((e) => ({
      name: e.name,
      type: e.type,
      salience: e.salience,
    })),
  };
}

async function analyzeSyntax(text) {
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    return { sentences: [], tokens: [] };
  }

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await getClient().analyzeSyntax({ document });

  return {
    sentences: result.sentences || [],
    tokens: (result.tokens || []).map((t) => ({
      text: t.text?.content || '',
      partOfSpeech: t.partOfSpeech,
      dependencyEdge: t.dependencyEdge,
      lemma: t.lemma || '',
    })),
  };
}

/**
 * Comprehensive AI validation that detects ALL errors and provides corrections
 * Returns an array of errors: [{type: string, issue: string, correction: string, severity: 'error'|'warning'}]
 */
async function validateComprehensively(text, fieldLabel, fieldType, quizData = null) {
  const errors = [];
  
  if (!text || text.trim().length === 0) {
    return errors;
  }

  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    return errors;
  }

  try {
    // 1. Sentiment Analysis - detect negative/inappropriate tone
    const sentiment = await analyzeSentiment(text);
    if (sentiment.score < -0.6) {
      const suggestedCorrection = text.replace(/\b(hate|terrible|awful|horrible|disgusting|worst|stupid|idiot|fail)\b/gi, (match) => {
        const alternatives = {
          'hate': 'dislike',
          'terrible': 'needs improvement',
          'awful': 'challenging',
          'horrible': 'difficult',
          'disgusting': 'concerning',
          'worst': 'least preferred',
          'stupid': 'unclear',
          'idiot': 'mistake',
          'fail': 'needs work'
        };
        return alternatives[match.toLowerCase()] || match;
      });
      
      errors.push({
        type: 'sentiment',
        issue: 'The tone is very negative and may be inappropriate.',
        correction: suggestedCorrection !== text ? `Consider: "${suggestedCorrection}"` : 'Please consider using more neutral or positive language.',
        severity: sentiment.score < -0.8 ? 'error' : 'warning'
      });
    }

    // 2. Entity Recognition - validate names, companies, emails, etc.
    const entities = await analyzeEntities(text);
    
    // Check for name/company fields
    if (/name|company|organization|business/i.test(fieldLabel) && !quizData) {
      const personEntities = entities.entities.filter(e => e.type === 'PERSON');
      const organizationEntities = entities.entities.filter(e => e.type === 'ORGANIZATION');
      
      // Prioritize company/organization checks (check these FIRST)
      // This prevents "Company Name" from being validated as a person name
      const isCompanyField = /company|organization|business/i.test(fieldLabel);
      const isNameField = /name/i.test(fieldLabel) && !isCompanyField;
      
      if (isCompanyField) {
        // This is a company/organization field
        if (organizationEntities.length === 0) {
          errors.push({
            type: 'entity',
            issue: 'This does not appear to be a valid company or organization name.',
            correction: 'Please provide a proper company name (e.g., "Acme Corporation", "ABC Industries").',
            severity: 'error'
          });
        }
      } else if (isNameField) {
        // This is a name field (and NOT a company field)
        if (personEntities.length === 0) {
          errors.push({
            type: 'entity',
            issue: 'This does not appear to be a valid name.',
            correction: 'Please provide a proper name (e.g., "John Smith", "Maria Garcia").',
            severity: 'error'
          });
        }
      }
    }

    // 3. Email validation
    if (fieldType === 'email' || /email/i.test(fieldLabel)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text.trim())) {
        const suggestedEmail = text.trim().includes('@') 
          ? text.trim().replace(/\s+/g, '').replace(/[^@\w.-]/g, '')
          : 'Please provide a valid email format (e.g., user@example.com)';
        
        errors.push({
          type: 'format',
          issue: 'Invalid email format.',
          correction: suggestedEmail.includes('@') ? `Suggested: "${suggestedEmail}"` : suggestedEmail,
          severity: 'error'
        });
      }
    }

    // 4. Number validation
    if (fieldType === 'number' || /number|amount|quantity|count/i.test(fieldLabel)) {
      const numValue = parseFloat(text.trim());
      if (isNaN(numValue)) {
        const extractedNumber = text.match(/-?\d+\.?\d*/);
        errors.push({
          type: 'format',
          issue: 'This is not a valid number.',
          correction: extractedNumber ? `Did you mean: "${extractedNumber[0]}"?` : 'Please provide a valid number.',
          severity: 'error'
        });
      }
    }

    // 5. Syntax and Grammar Analysis
    if (text.trim().length > 10) { // Only check syntax for longer texts
      try {
        const syntax = await analyzeSyntax(text);
        
        // Check for very short sentences that might indicate incomplete thoughts
        const sentences = syntax.sentences || [];
        const shortSentences = sentences.filter(s => {
          const sentenceText = s.text?.content || '';
          return sentenceText.trim().length < 5 && sentenceText.trim().length > 0;
        });
        
        if (shortSentences.length > 0 && text.trim().length > 20) {
          errors.push({
            type: 'grammar',
            issue: 'Some sentences appear incomplete or too short.',
            correction: 'Please provide more complete and detailed answers.',
            severity: 'warning'
          });
        }

        // Check for repeated words (potential typos)
        const words = text.toLowerCase().split(/\s+/);
        const wordCounts = {};
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        const repeatedWords = Object.entries(wordCounts)
          .filter(([word, count]) => count > 3 && word.length > 3)
          .map(([word]) => word);
        
        if (repeatedWords.length > 0) {
          errors.push({
            type: 'style',
            issue: `The word "${repeatedWords[0]}" is repeated too many times.`,
            correction: 'Consider using synonyms or rephrasing to improve clarity.',
            severity: 'warning'
          });
        }
      } catch (syntaxError) {
        // Syntax analysis failed, skip grammar checks
        console.warn('Syntax analysis failed:', syntaxError.message);
      }
    }

    // 6. Length validation for text fields
    if (fieldType === 'text' || fieldType === 'textarea') {
      if (text.trim().length < 3 && text.trim().length > 0) {
        errors.push({
          type: 'length',
          issue: 'Answer is too short.',
          correction: 'Please provide a more detailed answer (at least 3 characters).',
          severity: 'warning'
        });
      }
      
      if (text.trim().length > 5000) {
        errors.push({
          type: 'length',
          issue: 'Answer is extremely long.',
          correction: 'Consider breaking this into smaller, more manageable sections.',
          severity: 'warning'
        });
      }
    }

    // 7. Quiz-specific validation
    if (quizData && quizData.questionType && quizData.correctAnswer) {
      const userAnswer = text.trim().toLowerCase();
      const correctAnswer = quizData.correctAnswer.trim().toLowerCase();
      
      if (quizData.questionType === 'fill_blank') {
        if (userAnswer !== correctAnswer) {
          // Use entity analysis to check semantic similarity
          const userEntities = await analyzeEntities(text);
          const correctEntities = await analyzeEntities(quizData.correctAnswer);
          
          const userEntityNames = (userEntities.entities || []).map(e => e.name?.toLowerCase() || '').filter(Boolean);
          const correctEntityNames = (correctEntities.entities || []).map(e => e.name?.toLowerCase() || '').filter(Boolean);
          
          const hasCommonEntities = userEntityNames.some(name => 
            correctEntityNames.some(correctName => 
              name.includes(correctName) || correctName.includes(name)
            )
          );
          
          if (hasCommonEntities || userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
            errors.push({
              type: 'quiz',
              issue: 'Your answer is close but may not be exactly correct.',
              correction: `Correct answer: "${quizData.correctAnswer}"`,
              severity: 'warning'
            });
          } else {
            errors.push({
              type: 'quiz',
              issue: 'Your answer does not match the expected answer.',
              correction: `Correct answer: "${quizData.correctAnswer}"`,
              severity: 'error'
            });
          }
        }
      } else if (quizData.questionType === 'multiple_choice' || quizData.questionType === 'true_false') {
        if (userAnswer !== correctAnswer) {
          errors.push({
            type: 'quiz',
            issue: 'Your answer is incorrect.',
            correction: `Correct answer: "${quizData.correctAnswer}"`,
            severity: 'error'
          });
        }
      }
    }

    // 8. Check for potentially inappropriate content (basic profanity detection)
    const profanityPatterns = /\b(shit|fuck|damn|hell|bitch|asshole|bastard)\b/gi;
    if (profanityPatterns.test(text)) {
      const cleanedText = text.replace(profanityPatterns, (match) => {
        const replacements = {
          'shit': '[removed]',
          'fuck': '[removed]',
          'damn': 'darn',
          'hell': 'heck',
          'bitch': '[removed]',
          'asshole': '[removed]',
          'bastard': '[removed]'
        };
        return replacements[match.toLowerCase()] || '[removed]';
      });
      
      errors.push({
        type: 'content',
        issue: 'Inappropriate language detected.',
        correction: `Please use professional language. Suggested: "${cleanedText}"`,
        severity: 'error'
      });
    }

    // 9. Check for excessive capitalization (shouting)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 5) {
      errors.push({
        type: 'style',
        issue: 'Excessive use of capital letters (shouting).',
        correction: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
        severity: 'warning'
      });
    }

    // 10. Check for special character misuse
    const excessiveSpecialChars = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (excessiveSpecialChars > text.length * 0.3 && text.length > 10) {
      errors.push({
        type: 'format',
        issue: 'Too many special characters used.',
        correction: 'Please use standard punctuation and formatting.',
        severity: 'warning'
      });
    }

  } catch (error) {
    console.error('Comprehensive AI validation error:', error);
    // Return any errors found before the failure
  }

  return errors;
}

module.exports = { analyzeSentiment, analyzeEntities, analyzeSyntax, validateComprehensively };


