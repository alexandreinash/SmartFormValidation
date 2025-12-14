# Form Examples for Testing Google NLP API

Here are example forms you can create to test different AI validation features:

---

## 1. Customer Feedback Form (Sentiment Analysis)

**Purpose:** Test sentiment analysis for customer feedback

**Fields:**
- **Field 1:** "Your Name" (Text, Required, AI Validation: ON)
  - Tests: Entity recognition (should detect PERSON)
  
- **Field 2:** "Company Name" (Text, Required, AI Validation: ON)
  - Tests: Entity recognition (should detect ORGANIZATION)
  
- **Field 3:** "Feedback" (Textarea, Required, AI Validation: ON)
  - Tests: Sentiment analysis, grammar, content filtering

**Test Cases:**
- ✅ Positive: "I love this product! It's amazing and works perfectly!"
- ❌ Negative: "I hate this service! It's terrible and awful!"
- ⚠️ Mixed: "The product is good but the customer service needs improvement."

---

## 2. Job Application Form (Entity & Sentiment)

**Purpose:** Test entity recognition for names, companies, and professional content

**Fields:**
- **Field 1:** "Full Name" (Text, Required, AI Validation: ON)
  - Tests: PERSON entity recognition
  
- **Field 2:** "Previous Company" (Text, Required, AI Validation: ON)
  - Tests: ORGANIZATION entity recognition
  
- **Field 3:** "Why do you want this job?" (Textarea, Required, AI Validation: ON)
  - Tests: Sentiment (should be positive), grammar, completeness

**Test Cases:**
- ✅ Valid: "John Smith", "Microsoft Corporation", "I'm excited to join because..."
- ❌ Invalid: "hello", "abc123", "I don't really care about this job"

---

## 3. Product Review Form (Comprehensive AI Validation)

**Purpose:** Test all AI validation features together

**Fields:**
- **Field 1:** "Product Name" (Text, Required, AI Validation: ON)
  - Tests: Entity recognition (CONSUMER_GOOD)
  
- **Field 2:** "Your Review" (Textarea, Required, AI Validation: ON)
  - Tests: Sentiment, grammar, profanity detection, length validation

**Test Cases:**
- ✅ Good Review: "This product exceeded my expectations. Great quality and fast shipping!"
- ❌ Bad Review: "This is shit! Worst product ever! FUCK THIS!"
- ⚠️ Incomplete: "bad" (too short)
- ⚠️ Excessive Caps: "THIS PRODUCT IS AMAZING!!!" (shouting detection)

---

## 4. Contact Form (Email & Entity Validation)

**Purpose:** Test email validation and entity recognition

**Fields:**
- **Field 1:** "Name" (Text, Required, AI Validation: ON)
  - Tests: PERSON entity recognition
  
- **Field 2:** "Email" (Email, Required, AI Validation: ON)
  - Tests: Email format validation, entity recognition
  
- **Field 3:** "Message" (Textarea, Required, AI Validation: ON)
  - Tests: Sentiment, grammar, completeness

**Test Cases:**
- ✅ Valid: "Maria Garcia", "maria@example.com", "I would like to inquire about..."
- ❌ Invalid: "123", "notanemail", "I HATE YOUR COMPANY!"

---

## 5. Survey Form (Mixed Validation)

**Purpose:** Test combination of required fields and AI validation

**Fields:**
- **Field 1:** "Age" (Number, Required, AI Validation: OFF)
  - Basic validation only
  
- **Field 2:** "Occupation" (Text, Required, AI Validation: ON)
  - Tests: Entity recognition
  
- **Field 3:** "Comments" (Textarea, Optional, AI Validation: ON)
  - Tests: Sentiment, grammar (only if provided)

**Test Cases:**
- Mix of valid/invalid inputs to test partial validation

---

## 6. Complaint Form (Negative Sentiment Detection)

**Purpose:** Specifically test negative sentiment detection

**Fields:**
- **Field 1:** "Complaint Title" (Text, Required, AI Validation: ON)
  - Tests: Sentiment, entity recognition
  
- **Field 2:** "Detailed Complaint" (Textarea, Required, AI Validation: ON)
  - Tests: Sentiment (should allow negative for complaints), grammar, profanity

**Test Cases:**
- ⚠️ Very Negative: "I hate this! It's disgusting and terrible!"
- ✅ Constructive: "I experienced issues with the product. The quality needs improvement."

---

## 7. Event Registration Form (Name & Organization)

**Purpose:** Test entity recognition for events

**Fields:**
- **Field 1:** "Attendee Name" (Text, Required, AI Validation: ON)
  - Tests: PERSON entity
  
- **Field 2:** "Organization" (Text, Required, AI Validation: ON)
  - Tests: ORGANIZATION entity
  
- **Field 3:** "Special Requests" (Textarea, Optional, AI Validation: ON)
  - Tests: Sentiment, grammar

**Test Cases:**
- ✅ Valid: "Dr. Sarah Johnson", "Tech Solutions Inc.", "Please accommodate dietary restrictions"
- ❌ Invalid: "test", "company", "I don't care"

---

## 8. Quiz Form (AI-Powered Quiz Validation)

**Purpose:** Test quiz-specific AI validation

**Fields:**
- **Field 1:** "What is the capital of France?" (Text, Required, AI Validation: ON)
  - Quiz mode: Correct answer = "Paris"
  - Tests: Entity recognition for semantic similarity
  
- **Field 2:** "Who wrote Romeo and Juliet?" (Text, Required, AI Validation: ON)
  - Quiz mode: Correct answer = "William Shakespeare"
  - Tests: PERSON entity matching

**Test Cases:**
- ✅ Correct: "Paris", "Shakespeare"
- ⚠️ Close: "París", "Shakespeare" (typo detection)
- ❌ Wrong: "London", "Mark Twain"

---

## Quick Test Scenarios

### Scenario 1: Positive Sentiment Test
**Form:** Customer Feedback
**Input:** "I absolutely love this product! It's fantastic and exceeded all my expectations. Highly recommend!"
**Expected:** ✅ Passes validation, positive sentiment detected

### Scenario 2: Negative Sentiment Test
**Form:** Customer Feedback  
**Input:** "I hate this product! It's terrible, awful, and disgusting. Worst purchase ever!"
**Expected:** ❌ Flagged for negative sentiment, suggests corrections

### Scenario 3: Entity Recognition Test
**Form:** Job Application
**Name:** "John Smith" → ✅ Should detect PERSON
**Name:** "hello123" → ❌ Should flag as invalid name

**Company:** "Microsoft Corporation" → ✅ Should detect ORGANIZATION
**Company:** "my company" → ❌ Should flag as invalid company

### Scenario 4: Profanity Detection
**Form:** Product Review
**Input:** "This product is shit! Fuck this company!"
**Expected:** ❌ Flagged for inappropriate language, suggests cleaned version

### Scenario 5: Grammar & Completeness
**Form:** Contact Form
**Input:** "bad" (too short)
**Expected:** ⚠️ Warning: Answer is too short

**Input:** "I want to know about your services and how they can help my business grow and succeed in the market"
**Expected:** ✅ Passes validation

### Scenario 6: Excessive Capitalization
**Form:** Feedback Form
**Input:** "THIS PRODUCT IS AMAZING!!!"
**Expected:** ⚠️ Warning: Excessive use of capital letters (shouting)

---

## How to Create These Forms

1. **Login as Admin**
   - Go to `/admin` or `/admin/create-form`

2. **Create Form**
   - Enter form title
   - Add fields with labels
   - Enable "Required" where needed
   - Enable "AI Validation" for fields you want to test

3. **Save Form**
   - Click "Save Form"
   - Note the form ID

4. **Test the Form**
   - Go to `/forms/{formId}`
   - Fill with test cases above
   - Submit and check AI validation results

---

## Expected AI Validation Results

### Sentiment Analysis
- **Score < -0.6:** Flagged as negative
- **Score > 0.6:** Positive sentiment
- **Score -0.6 to 0.6:** Neutral

### Entity Recognition
- **PERSON:** Detects names like "John Smith", "Maria Garcia"
- **ORGANIZATION:** Detects companies like "Microsoft", "Acme Corp"
- **CONSUMER_GOOD:** Detects products

### Grammar & Style
- Incomplete sentences
- Repeated words
- Excessive capitalization
- Special character misuse

### Content Filtering
- Profanity detection
- Inappropriate language
- Length validation (too short/too long)

---

## Tips for Testing

1. **Test One Feature at a Time**
   - Create simple forms with 1-2 fields
   - Focus on specific validation types

2. **Use Clear Test Cases**
   - Positive examples (should pass)
   - Negative examples (should fail)
   - Edge cases (should warn)

3. **Check Backend Logs**
   - Look for "Google NLP credentials loaded"
   - Check for any error messages
   - Verify API calls are being made

4. **Check Frontend Response**
   - Look for AI validation messages
   - Check if errors are displayed correctly
   - Verify corrections are suggested

---

## Ready to Test!

Pick any form example above and create it in your system. The Google NLP API will automatically validate the inputs based on the field types and labels!


