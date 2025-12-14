# All Example Forms - Quick Reference

All forms have been created in your system! Here's the complete list:

---

## 📋 Available Forms

### 1. **Product Review Form** (ID: 21)
**URL:** `http://localhost:5174/forms/21`

**Fields:**
- Product Name (Text, Required, AI: ON)
- Your Review (Textarea, Required, AI: ON)

**Test Cases:**
- ✅ Positive: "I love this product! It's amazing and works perfectly!"
- ❌ Negative: "I hate this product! It's terrible and awful!" (will be flagged)
- ⚠️ Profanity: "This is shit! Worst product ever!" (will be flagged)

---

### 2. **Job Application Form** (ID: 22)
**URL:** `http://localhost:5174/forms/22`

**Fields:**
- Full Name (Text, Required, AI: ON) - Tests PERSON entity
- Previous Company (Text, Required, AI: ON) - Tests ORGANIZATION entity
- Why do you want this job? (Textarea, Required, AI: ON) - Tests sentiment

**Test Cases:**
- ✅ Valid: "John Smith", "Microsoft Corporation", "I'm excited to join because..."
- ❌ Invalid: "hello123", "abc company", "I don't really care" (will be flagged)

---

### 3. **Contact Form** (ID: 23)
**URL:** `http://localhost:5174/forms/23`

**Fields:**
- Name (Text, Required, AI: ON) - Tests PERSON entity
- Email (Email, Required, AI: ON) - Tests email format
- Message (Textarea, Required, AI: ON) - Tests sentiment & grammar

**Test Cases:**
- ✅ Valid: "Maria Garcia", "maria@example.com", "I would like to inquire about..."
- ❌ Invalid: "123", "notanemail", "I HATE YOUR COMPANY!" (will be flagged)

---

### 4. **Event Registration Form** (ID: 24)
**URL:** `http://localhost:5174/forms/24`

**Fields:**
- Attendee Name (Text, Required, AI: ON) - Tests PERSON entity
- Organization (Text, Required, AI: ON) - Tests ORGANIZATION entity
- Special Requests (Textarea, Optional, AI: ON) - Tests sentiment

**Test Cases:**
- ✅ Valid: "Dr. Sarah Johnson", "Tech Solutions Inc.", "Please accommodate dietary restrictions"
- ❌ Invalid: "test", "company", "I don't care" (will be flagged)

---

### 5. **Customer Survey Form** (ID: 25)
**URL:** `http://localhost:5174/forms/25`

**Fields:**
- Age (Number, Required, AI: OFF) - Basic validation only
- Occupation (Text, Required, AI: ON) - Tests entity recognition
- Comments (Textarea, Optional, AI: ON) - Tests sentiment

**Test Cases:**
- Mix of valid/invalid inputs to test partial validation
- Age: 25 (valid number)
- Occupation: "Software Engineer" (should pass)
- Comments: "Great service!" (positive sentiment)

---

### 6. **Complaint Form** (ID: 27)
**URL:** `http://localhost:5174/forms/27`

**Fields:**
- Complaint Title (Text, Required, AI: ON) - Tests sentiment & entity
- Detailed Complaint (Textarea, Required, AI: ON) - Tests sentiment, grammar, profanity

**Test Cases:**
- ⚠️ Very Negative: "I hate this! It's disgusting and terrible!" (will be flagged)
- ✅ Constructive: "I experienced issues with the product. The quality needs improvement."

---

### 7. **Customer Feedback Form** (ID: 28)
**URL:** `http://localhost:5174/forms/28`

**Fields:**
- Your Name (Text, Required, AI: ON) - Tests PERSON entity
- Company Name (Text, Required, AI: ON) - Tests ORGANIZATION entity
- Feedback (Textarea, Required, AI: ON) - Tests sentiment, grammar, content

**Test Cases:**
- ✅ Positive: "John Smith", "Acme Corp", "Excellent service! Very satisfied!"
- ❌ Negative: "test", "abc", "I hate everything about this!" (will be flagged)

---

### 8. **Service Request Form** (ID: 29)
**URL:** `http://localhost:5174/forms/29`

**Fields:**
- Client Name (Text, Required, AI: ON) - Tests PERSON entity
- Company (Text, Required, AI: ON) - Tests ORGANIZATION entity
- Service Description (Textarea, Required, AI: ON) - Tests sentiment & grammar

**Test Cases:**
- ✅ Valid: "Jane Doe", "ABC Industries", "I need help with website development"
- ❌ Invalid: "client", "my business", "I don't know what I need" (will be flagged)

---

## 🧪 Quick Test Scenarios

### Test 1: Sentiment Analysis
**Form:** Product Review Form (21)
**Input:** "I hate this product! It's terrible and awful!"
**Expected:** ❌ Flagged for negative sentiment

### Test 2: Entity Recognition - Name
**Form:** Job Application Form (22)
**Input:** "John Smith" → ✅ Should pass
**Input:** "hello123" → ❌ Should flag as invalid name

### Test 3: Entity Recognition - Company
**Form:** Event Registration Form (24)
**Input:** "Microsoft Corporation" → ✅ Should pass
**Input:** "my company" → ❌ Should flag as invalid company

### Test 4: Profanity Detection
**Form:** Complaint Form (27)
**Input:** "This is shit! Fuck this company!"
**Expected:** ❌ Flagged for inappropriate language

### Test 5: Grammar & Completeness
**Form:** Contact Form (23)
**Input:** "bad" (too short)
**Expected:** ⚠️ Warning: Answer is too short

### Test 6: Excessive Capitalization
**Form:** Customer Feedback Form (28)
**Input:** "THIS PRODUCT IS AMAZING!!!"
**Expected:** ⚠️ Warning: Excessive use of capital letters

---

## 📊 Form Summary Table

| Form ID | Form Name | Fields | AI Validation | Test Focus |
|---------|-----------|--------|----------------|------------|
| 21 | Product Review | 2 | ✅ | Sentiment, Profanity |
| 22 | Job Application | 3 | ✅ | Entity (Name, Company), Sentiment |
| 23 | Contact | 3 | ✅ | Entity (Name), Email, Sentiment |
| 24 | Event Registration | 3 | ✅ | Entity (Name, Organization) |
| 25 | Customer Survey | 3 | ✅ | Entity, Sentiment (partial) |
| 27 | Complaint | 2 | ✅ | Sentiment, Profanity, Grammar |
| 28 | Customer Feedback | 3 | ✅ | Entity, Sentiment, Grammar |
| 29 | Service Request | 3 | ✅ | Entity (Name, Company), Sentiment |

---

## 🚀 How to Access

1. **Direct Links:**
   - Product Review: http://localhost:5174/forms/21
   - Job Application: http://localhost:5174/forms/22
   - Contact: http://localhost:5174/forms/23
   - Event Registration: http://localhost:5174/forms/24
   - Customer Survey: http://localhost:5174/forms/25
   - Complaint: http://localhost:5174/forms/27
   - Customer Feedback: http://localhost:5174/forms/28
   - Service Request: http://localhost:5174/forms/29

2. **Via Admin Dashboard:**
   - Go to `/admin/forms/all` to see all forms
   - Click on any form to view/edit

3. **Via User Form Selection:**
   - Go to `/user/forms` to see available forms

---

## ✅ All Forms Created Successfully!

All 8 example forms are now in your system and ready to test Google NLP API features!

**Next Steps:**
1. Visit any form URL above
2. Fill it with test cases
3. Submit and see AI validation in action
4. Check the results - negative sentiment, invalid entities, profanity, etc. will be flagged!

---

**Happy Testing! 🎉**

