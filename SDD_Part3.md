# Software Design Document (SDD) - Part 3
## Smart Form Validator with AI Integration

---

## 6. Interface Design

### 6.1 User Interface Design

#### 6.1.1 Design Principles

**Consistency:**
- Unified color scheme across all pages
- Consistent button styles and interactions
- Standard form layouts and validation patterns
- Predictable navigation structure

**Simplicity:**
- Minimal cognitive load
- Clear call-to-action buttons
- Progressive disclosure of complex features
- Intuitive iconography

**Responsiveness:**
- Mobile-first design approach
- Fluid layouts with CSS Grid and Flexbox
- Breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly interactive elements (min 44x44px)

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support

---

#### 6.1.2 Color Scheme

**Primary Colors:**
- Primary Blue: `#007bff` (buttons, links, active states)
- Success Green: `#28a745` (success messages, positive indicators)
- Warning Orange: `#ffc107` (warnings, AI suggestions)
- Error Red: `#dc3545` (errors, validation failures)

**Neutral Colors:**
- Background: `#f8f9fa` (page background)
- Card Background: `#ffffff` (content containers)
- Text Primary: `#212529` (main text)
- Text Secondary: `#6c757d` (secondary text, labels)
- Border: `#dee2e6` (dividers, input borders)

**AI-Specific Colors:**
- AI Flag Highlight: `#fff3cd` (AI-flagged content)
- AI Suggestion: `#d1ecf1` (AI recommendations)

---

#### 6.1.3 Typography

**Font Family:**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Monospace: `'Courier New', monospace` (code, tokens)

**Font Sizes:**
- h1: 2.5rem (40px) - Page titles
- h2: 2rem (32px) - Section headers
- h3: 1.5rem (24px) - Subsection headers
- Body: 1rem (16px) - Main content
- Small: 0.875rem (14px) - Helper text, labels
- Caption: 0.75rem (12px) - Timestamps, metadata

**Font Weights:**
- Light: 300 (secondary text)
- Regular: 400 (body text)
- Medium: 500 (labels, emphasis)
- Bold: 700 (headings, important text)

---

#### 6.1.4 Page Layouts

##### Landing Page Layout
```
┌─────────────────────────────────────────────────────────┐
│                    Navigation Bar                        │
│   [Logo]           [Features] [Pricing] [Login] [Sign Up]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│                     Hero Section                         │
│        Smart Form Validation with AI Integration        │
│      "Validate forms intelligently with AI-powered       │
│             sentiment and entity detection"              │
│                                                          │
│          [Get Started] [Learn More]                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                   Features Section                       │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│   │  Dynamic  │  │    AI     │  │Real-time  │         │
│   │   Forms   │  │Validation │  │Analytics  │         │
│   └───────────┘  └───────────┘  └───────────┘         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                      Footer                              │
│   © 2025 Smart Form Validator | Privacy | Terms         │
└─────────────────────────────────────────────────────────┘
```

##### Admin Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Smart Form Validator       [User Menu] [Logout]│
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│ Sidebar  │              Dashboard Content               │
│          │                                               │
│ • Dashboard│  ┌──────────┐  ┌──────────┐               │
│ • Forms  │  │  Total    │  │  Total   │               │
│ • Create │  │  Forms    │  │ Submiss. │               │
│ • Submis.│  │    24     │  │   156    │               │
│ • Analyt.│  └──────────┘  └──────────┘               │
│ • Groups │                                               │
│ • Users  │  ┌──────────┐  ┌──────────┐               │
│ • Audit  │  │  This    │  │   AI     │               │
│          │  │  Month   │  │  Flags   │               │
│          │  │    42    │  │    8     │               │
│          │  └──────────┘  └──────────┘               │
│          │                                               │
│          │           Recent Activity                     │
│          │  • New submission on Contact Form            │
│          │  • Form "Survey" created                     │
│          │  • 3 AI flags on Customer Feedback           │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

##### Form Builder Layout
```
┌─────────────────────────────────────────────────────────┐
│  Form Builder                      [Preview] [Save]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Form Title: [____________________]                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Field 1: Name                          [Edit] │    │
│  │  Type: Text | Required: ☑ | AI: ☐             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Field 2: Email                         [Edit] │    │
│  │  Type: Email | Required: ☑ | AI: ☐            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Field 3: Feedback                      [Edit] │    │
│  │  Type: Textarea | Required: ☑ | AI: ☑         │    │
│  │  Expected Sentiment: Positive                   │    │
│  │  Expected Entity: Any                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [+ Add Field]                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**[SCREENSHOT 16: Form Fill Page with Various Field Types]**
> **Description:** Screenshot of a form being filled by an end-user showing:
> - Form title clearly displayed
> - Variety of field types visible:
>   - Text input field (e.g., "Full Name")
>   - Email input field with validation
>   - Phone number field with formatting
>   - Date picker field
>   - Dropdown/select field with options visible
>   - Textarea field for longer text (e.g., "Comments")
>   - Radio buttons or checkboxes for selections
> - Required field indicators (*)
> - Field validation messages (if any)
> - AI validation enabled indicator on applicable fields
> - Form progress indicator (if applicable)
> - Submit and Cancel buttons at bottom

---

##### Form Fill Layout
```
┌─────────────────────────────────────────────────────────┐
│                  Customer Feedback Form                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Name: *                                                 │
│  [_____________________________]                         │
│                                                          │
│  Email: *                                                │
│  [_____________________________]                         │
│                                                          │
│  Your Feedback: *                                        │
│  [                                ]                      │
│  [                                ]                      │
│  [                                ]                      │
│  [________________________________]                      │
│  💡 AI is enabled - We'll check sentiment & content      │
│                                                          │
│  Rate Your Experience: *                                 │
│  ○ Excellent  ○ Good  ○ Fair  ○ Poor                    │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ ⚠️  AI Validation Feedback:                  │      │
│  │ • Expected positive sentiment, found negative│      │
│  │   💡 Try: "I enjoyed..." instead of          │      │
│  │      "I disliked..."                         │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│           [Cancel]  [Submit Anyway]  [Submit]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

#### 6.1.5 Navigation Structure

**Public Navigation:**
- Home
- Login
- Register
- Forgot Password

**User Navigation:**
- Dashboard
- My Forms
- Fill Forms
- Profile
- Logout

**Admin Navigation:**
- Dashboard
  - Overview
  - Statistics
- Forms
  - All Forms
  - Create Form
  - Form Templates
- Submissions
  - All Submissions
  - Flagged Submissions
  - Export Data
- Analytics
  - Overview
  - Form Analytics
  - User Analytics
  - AI Insights
- Groups
  - All Groups
  - Create Group
  - Manage Members
- Users
  - All Users
  - Invite Users
  - Manage Roles
- Audit
  - Activity Logs
  - System Logs
- Settings
  - Account Settings
  - Integrations
  - Notifications

---

**[SCREENSHOT 17: User Profile/Settings Page]**
> **Description:** Screenshot of the user profile or settings page showing:
> - Page title "Profile" or "Account Settings"
> - User information section:
>   - Profile picture or avatar
>   - Username (editable field)
>   - Email address (display or editable)
>   - Role (Admin/User) displayed
>   - Account creation date
> - Password change section:
>   - Current password field
>   - New password field
>   - Confirm password field
>   - "Change Password" button
> - Account settings:
>   - Email notifications toggle
>   - Language preferences
>   - Timezone settings
> - OAuth connections:
>   - Google account connection status
>   - Connect/disconnect options
> - Save/Update button
> - Delete account option (if applicable)

---

### 6.2 API Interface Design

#### 6.2.1 RESTful Endpoints

**Base URL:** `https://api.smartformvalidator.com/api`

**Authentication:** Bearer token in Authorization header
```
Authorization: Bearer <JWT_TOKEN>
```

---

##### Authentication Endpoints

**POST /auth/register**
```json
Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-12-18T10:00:00Z"
  }
}

Error (400):
{
  "success": false,
  "message": "Email already exists"
}
```

**POST /auth/login**
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}

Error (401):
{
  "success": false,
  "message": "Invalid credentials"
}
```

**POST /auth/google**
```json
Request:
{
  "credential": "google_oauth_token_here"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "John Doe",
    "email": "john@gmail.com",
    "role": "user"
  },
  "isNewUser": false
}
```

**POST /auth/forgot-password**
```json
Request:
{
  "email": "john@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset email sent"
}
```

**POST /auth/reset-password**
```json
Request:
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful"
}

Error (400):
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

**[SCREENSHOT 18: Forgot Password Page]**
> **Description:** Screenshot of the forgot/reset password page showing:
> - Page title "Forgot Password" or "Reset Password"
> - Step 1 (Request Reset):
>   - Email input field
>   - "Send Reset Link" button
>   - Back to login link
> - OR Step 2 (After email sent):
>   - Success message "Check your email for reset instructions"
>   - Email icon
>   - Resend email option
> - OR Step 3 (New Password):
>   - New password field
>   - Confirm password field
>   - Password strength indicator
>   - "Reset Password" button

---

**GET /auth/me**
```json
Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "account_id": null,
    "is_account_owner": true,
    "created_at": "2025-12-18T10:00:00Z"
  }
}
```

---

##### Form Management Endpoints

**GET /forms**
```json
Query Parameters:
- account_id (optional): Filter by account

Response (200):
{
  "success": true,
  "forms": [
    {
      "id": 1,
      "title": "Customer Feedback",
      "created_by": 1,
      "created_at": "2025-12-18T10:00:00Z",
      "field_count": 5,
      "submission_count": 42
    }
  ]
}
```

**GET /forms/:id**
```json
Response (200):
{
  "success": true,
  "form": {
    "id": 1,
    "title": "Customer Feedback",
    "created_by": 1,
    "created_at": "2025-12-18T10:00:00Z",
    "fields": [
      {
        "id": 1,
        "form_id": 1,
        "label": "Name",
        "type": "text",
        "is_required": true,
        "ai_validation_enabled": false,
        "expected_entity": "none",
        "expected_sentiment": "any",
        "options": null
      },
      {
        "id": 2,
        "form_id": 1,
        "label": "Feedback",
        "type": "textarea",
        "is_required": true,
        "ai_validation_enabled": true,
        "expected_entity": "none",
        "expected_sentiment": "positive",
        "options": null
      }
    ]
  }
}
```

**POST /forms**
```json
Request:
{
  "title": "Customer Feedback",
  "fields": [
    {
      "label": "Name",
      "type": "text",
      "is_required": true,
      "ai_validation_enabled": false
    },
    {
      "label": "Feedback",
      "type": "textarea",
      "is_required": true,
      "ai_validation_enabled": true,
      "expected_sentiment": "positive"
    }
  ]
}

Response (201):
{
  "success": true,
  "form": {
    "id": 1,
    "title": "Customer Feedback",
    "created_by": 1,
    "created_at": "2025-12-18T10:00:00Z",
    "fields": [...]
  }
}
```

**PUT /forms/:id**
```json
Request:
{
  "title": "Updated Customer Feedback",
  "fields": [...]
}

Response (200):
{
  "success": true,
  "form": { ... }
}
```

**DELETE /forms/:id**
```json
Response (200):
{
  "success": true,
  "message": "Form deleted successfully"
}
```

---

##### Submission Endpoints

**POST /submissions**
```json
Request:
{
  "form_id": 1,
  "data": {
    "1": "John Doe",
    "2": "I hated this service, it was terrible"
  }
}

Response (201):
{
  "success": true,
  "submission": {
    "id": 1,
    "form_id": 1,
    "submitted_at": "2025-12-18T10:00:00Z"
  },
  "aiValidation": {
    "hasErrors": true,
    "errors": [
      {
        "field_id": 2,
        "field_label": "Feedback",
        "type": "sentiment_mismatch",
        "issue": "Expected positive sentiment, found negative (-0.8)",
        "correction": "Try using more positive language, e.g., 'I enjoyed...' instead of 'I hated...'",
        "severity": "warning"
      }
    ]
  }
}
```

**GET /submissions**
```json
Query Parameters:
- form_id (required): Filter by form
- flagged_only (optional): true/false

Response (200):
{
  "success": true,
  "submissions": [
    {
      "id": 1,
      "form_id": 1,
      "submitted_by": null,
      "submitted_at": "2025-12-18T10:00:00Z",
      "has_ai_flags": true,
      "data": [
        {
          "field_id": 1,
          "label": "Name",
          "value": "John Doe",
          "ai_sentiment_flag": false,
          "ai_entity_flag": false
        },
        {
          "field_id": 2,
          "label": "Feedback",
          "value": "I hated this service",
          "ai_sentiment_flag": true,
          "ai_entity_flag": false,
          "ai_errors": [...]
        }
      ]
    }
  ]
}
```

**GET /submissions/:id**
```json
Response (200):
{
  "success": true,
  "submission": {
    "id": 1,
    "form_id": 1,
    "form_title": "Customer Feedback",
    "submitted_by": null,
    "submitted_at": "2025-12-18T10:00:00Z",
    "data": [...]
  }
}
```

**DELETE /submissions/:id**
```json
Response (200):
{
  "success": true,
  "message": "Submission deleted successfully"
}
```

---

##### Analytics Endpoints

**GET /analytics/overview**
```json
Response (200):
{
  "success": true,
  "analytics": {
    "total_forms": 24,
    "total_submissions": 156,
    "submissions_this_month": 42,
    "ai_flagged_count": 8,
    "submission_trends": [
      { "date": "2025-12-01", "count": 5 },
      { "date": "2025-12-02", "count": 8 }
    ],
    "top_forms": [
      { "form_id": 1, "title": "Customer Feedback", "submissions": 42 }
    ],
    "ai_flag_rate": 0.05
  }
}
```

**GET /analytics/forms/:id**
```json
Response (200):
{
  "success": true,
  "analytics": {
    "form_id": 1,
    "title": "Customer Feedback",
    "total_submissions": 42,
    "timeline": [...],
    "field_stats": [
      {
        "field_id": 2,
        "label": "Feedback",
        "ai_flag_rate": 0.15,
        "common_issues": [
          { "type": "sentiment_mismatch", "count": 6 }
        ]
      }
    ]
  }
}
```

---

##### Group Management Endpoints

**GET /groups**
```json
Response (200):
{
  "success": true,
  "groups": [
    {
      "id": 1,
      "name": "Marketing Team",
      "description": "Marketing department group",
      "created_by": 1,
      "member_count": 5,
      "user_role": "admin"
    }
  ]
}
```

**POST /groups**
```json
Request:
{
  "name": "Marketing Team",
  "description": "Marketing department group"
}

Response (201):
{
  "success": true,
  "group": {
    "id": 1,
    "name": "Marketing Team",
    "description": "Marketing department group",
    "created_by": 1,
    "created_at": "2025-12-18T10:00:00Z"
  }
}
```

**POST /groups/:id/members**
```json
Request:
{
  "user_id": 5,
  "role": "member"
}

Response (201):
{
  "success": true,
  "member": {
    "id": 1,
    "group_id": 1,
    "user_id": 5,
    "role": "member",
    "joined_at": "2025-12-18T10:00:00Z"
  }
}
```

---

### 6.3 External API Integration

#### 6.3.1 Google Cloud Natural Language API

**API Version:** v1  
**Authentication:** Service Account Key (JSON)

**analyzeSentiment**
```json
Request:
POST https://language.googleapis.com/v1/documents:analyzeSentiment

{
  "document": {
    "type": "PLAIN_TEXT",
    "content": "I love this product, it's amazing!"
  },
  "encodingType": "UTF8"
}

Response:
{
  "documentSentiment": {
    "magnitude": 1.8,
    "score": 0.9
  },
  "language": "en",
  "sentences": [...]
}
```

**analyzeEntities**
```json
Request:
POST https://language.googleapis.com/v1/documents:analyzeEntities

{
  "document": {
    "type": "PLAIN_TEXT",
    "content": "John Smith works at Google in Mountain View."
  },
  "encodingType": "UTF8"
}

Response:
{
  "entities": [
    {
      "name": "John Smith",
      "type": "PERSON",
      "salience": 0.79,
      "mentions": [...]
    },
    {
      "name": "Google",
      "type": "ORGANIZATION",
      "salience": 0.21,
      "mentions": [...]
    }
  ],
  "language": "en"
}
```

---

**[SCREENSHOT 19: Manage Users Page (Admin)]**
> **Description:** Screenshot of the admin users management page showing:
> - Page title "Manage Users" or "Users"
> - "Invite New User" or "Add User" button
> - Search/filter options:
>   - Search by name or email
>   - Filter by role (Admin, User)
>   - Filter by status (Active, Inactive)
> - Table displaying users with columns:
>   - User ID
>   - Username
>   - Email address
>   - Role (Admin/User with badge or label)
>   - Account ID (if multi-tenant)
>   - Registration/Join date
>   - Last login date
>   - Status (Active/Inactive)
>   - Action buttons (Edit, Change Role, Delete, View Activity)
> - Pagination controls
> - Total users count
> - Export users list button

---

#### 6.3.2 Google OAuth 2.0

**Authorization Endpoint:**
```
https://accounts.google.com/o/oauth2/v2/auth
```

**Token Endpoint:**
```
https://oauth2.googleapis.com/token
```

**Scopes:**
- `openid`
- `profile`
- `email`

**Client Configuration:**
- Client ID: `593069010968-07lknp6t8a8vjcpv5n08hv81sf6v6iir.apps.googleusercontent.com`
- Redirect URI: `http://localhost:5173`

---

### 6.4 WebSocket Interface

#### 6.4.1 Connection

**URL:** `ws://localhost:5000` or `wss://api.smartformvalidator.com`

**Connection:**
```javascript
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  auth: {
    token: localStorage.getItem('token')
  }
});
```

---

#### 6.4.2 Events

**Client to Server:**

```javascript
// Join admin updates room
socket.emit('join-admin-room');

// Join form-specific room
socket.emit('join-form-room', formId);
```

**Server to Client:**

```javascript
// New submission notification
socket.on('new-submission', (data) => {
  // data: { submissionId, formId, formTitle, hasAiFlags }
});

// Form updated notification
socket.on('form-updated', (data) => {
  // data: { formId, title, updatedBy }
});

// Real-time statistics update
socket.on('stats-update', (data) => {
  // data: { totalSubmissions, totalFlagged, ... }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## 7. Security Design

### 7.1 Authentication

#### 7.1.1 JWT (JSON Web Token)

**Token Structure:**
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "id": 1,
  "email": "john@example.com",
  "role": "admin",
  "account_id": null,
  "iat": 1702900000,
  "exp": 1703504800
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**Token Lifecycle:**
- Issued upon successful login
- Stored in localStorage (frontend)
- Attached to all API requests via Authorization header
- Expires after 7 days
- Validated on every protected endpoint

**Token Generation:**
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { 
    id: user.id, 
    email: user.email, 
    role: user.role,
    account_id: user.account_id 
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Token Verification:**
```javascript
const jwt = require('jsonwebtoken');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
} catch (error) {
  return res.status(401).json({ 
    success: false, 
    message: 'Invalid token' 
  });
}
```

---

#### 7.1.2 Password Security

**Hashing Algorithm:** bcrypt with 10 salt rounds

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (recommended)
- At least one lowercase letter (recommended)
- At least one number (recommended)
- At least one special character (recommended)

**Password Hashing:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Password Reset Flow:**
1. User requests reset via email
2. System generates unique token (32-byte hex)
3. Token stored in `password_resets` table with 1-hour expiration
4. Reset link emailed to user
5. User clicks link and provides new password
6. System validates token (not expired, not used)
7. Password updated, token marked as used

---

#### 7.1.3 OAuth 2.0 Integration

**Google OAuth Flow:**
```
1. User clicks "Sign in with Google"
2. Frontend redirects to Google OAuth consent screen
3. User authenticates and authorizes app
4. Google redirects back with credential token
5. Frontend sends credential to backend
6. Backend verifies token with Google
7. Backend creates/retrieves user account
8. Backend issues JWT token
9. Frontend stores JWT and redirects to dashboard
```

**Token Verification:**
```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified
  };
}
```

---

### 7.2 Authorization

#### 7.2.1 Role-Based Access Control (RBAC)

**Roles:**
- **admin**: Full system access, can manage all forms and users
- **user**: Limited access, can fill forms and view own submissions

**Permission Matrix:**

| Resource | Action | Admin | User | Anonymous |
|----------|--------|-------|------|-----------|
| Forms | Create | ✓ | ✗ | ✗ |
| Forms | View All | ✓ | ✗ | ✗ |
| Forms | View Shared | ✓ | ✓ | ✗ |
| Forms | Edit Own | ✓ | ✗ | ✗ |
| Forms | Delete Own | ✓ | ✗ | ✗ |
| Forms | Fill | ✓ | ✓ | ✓* |
| Submissions | Submit | ✓ | ✓ | ✓* |
| Submissions | View All | ✓ | ✗ | ✗ |
| Submissions | View Own | ✓ | ✓ | ✗ |
| Submissions | Delete | ✓ | ✗ | ✗ |
| Analytics | View | ✓ | ✗ | ✗ |
| Groups | Create | ✓ | ✗ | ✗ |
| Groups | Manage | ✓ | ✗ | ✗ |
| Users | Manage | ✓ | ✗ | ✗ |
| Audit Logs | View | ✓ | ✗ | ✗ |

*Anonymous users can fill forms if the form is public

**Implementation:**
```javascript
// Middleware for role checking
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
}

// Usage
router.post('/forms', verifyToken, requireRole('admin'), createForm);
```

---

#### 7.2.2 Resource-Level Authorization

**Ownership Validation:**
- Users can only modify resources they own
- Account owners can manage all resources in their account
- Group admins can manage group members and permissions

**Example:**
```javascript
async function canEditForm(userId, formId) {
  const form = await Form.findByPk(formId);
  if (!form) return false;
  
  // Owner can edit
  if (form.created_by === userId) return true;
  
  // Account owner can edit
  const user = await User.findByPk(userId);
  if (user.is_account_owner && form.account_id === user.id) return true;
  
  return false;
}
```

---

### 7.3 Data Security

#### 7.3.1 Data Encryption

**In Transit:**
- HTTPS/TLS 1.3 for all API communications
- WSS (WebSocket Secure) for real-time connections
- Certificate: Let's Encrypt or GCP-managed SSL

**At Rest:**
- Google Cloud SQL automatic encryption
- AES-256 encryption for sensitive fields (future)
- Encrypted backups

---

#### 7.3.2 Input Validation

**Backend Validation:**
```javascript
const { body, validationResult } = require('express-validator');

// Example: User registration validation
router.post('/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('role').isIn(['admin', 'user'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  // Process registration...
});
```

**SQL Injection Prevention:**
- Sequelize ORM parameterized queries
- No raw SQL queries without sanitization
- Input escaping for all user data

**XSS Prevention:**
- Content Security Policy (CSP) headers
- Output encoding in React (automatic)
- Sanitization of HTML content

---

#### 7.3.3 Rate Limiting

**Configuration:**
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Auth-specific rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: false
});

// Submission rate limit
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 submissions per window
  message: 'Too many submissions, please slow down'
});
```

**IP-Based Throttling:**
- Tracks requests per IP address
- Responds with 429 Too Many Requests
- Includes `Retry-After` header

---

### 7.4 Security Headers

**Helmet.js Configuration:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://language.googleapis.com"],
      frameSrc: ["https://accounts.google.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

**CORS Configuration:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 7.5 Audit Logging

**Logged Events:**
- All authentication events (login, logout, failed attempts)
- CRUD operations on forms and submissions
- Permission changes
- User management actions
- Sensitive data access

**Audit Log Entry:**
```javascript
{
  id: 1,
  user_id: 5,
  action: 'FORM_CREATED',
  entity_type: 'form',
  entity_id: 42,
  details: {
    title: 'Customer Feedback',
    fields_count: 5
  },
  ip_address: '192.168.1.100',
  created_at: '2025-12-18T10:00:00Z'
}
```

**Retention:**
- Audit logs retained for 1 year
- Automatic archival to long-term storage
- Compliance with data retention policies

---

### 7.6 API Key Management

**Google Cloud Credentials:**
- Service account key stored as JSON file
- Path specified in `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Never committed to version control
- Rotated every 90 days

**JWT Secret:**
- Strong random string (256-bit minimum)
- Stored in environment variables
- Different secrets for dev/staging/production
- Rotated periodically

**Environment Variables:**
```bash
# Example .env file (never commit to repo)
JWT_SECRET=super_secret_key_change_in_production
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLIENT_ID=593069010968-xxxxx.apps.googleusercontent.com
```

---

### 7.7 Security Best Practices

**Code Security:**
- Regular dependency updates
- Vulnerability scanning (npm audit)
- Static code analysis
- Secure coding guidelines

**Database Security:**
- Principle of least privilege
- Separate database users for different operations
- Regular backups with encryption
- Network isolation (private IP)

**Deployment Security:**
- Secrets management (Google Secret Manager)
- Infrastructure as Code review
- Security groups and firewall rules
- DDoS protection (Cloud Armor)

---

## 8. Deployment Architecture

### 8.1 Infrastructure Overview

**Cloud Provider:** Google Cloud Platform (GCP)

**Services Used:**
- **Compute**: Cloud Run (containerized backend) or Compute Engine (VM)
- **Database**: Cloud SQL for MySQL
- **Storage**: Cloud Storage (file uploads, backups)
- **CDN**: Cloud CDN (frontend static assets)
- **DNS**: Cloud DNS
- **Monitoring**: Cloud Monitoring & Logging
- **API**: Cloud Natural Language API

---

### 8.2 Deployment Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      Internet                            │
└───────────────────────┬──────────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │   Cloud Load       │
              │   Balancer         │
              │   (HTTPS/TLS)      │
              └─────────┬──────────┘
                        │
          ┌─────────────┴────────────────┐
          │                              │
┌─────────▼────────────┐      ┌─────────▼──────────┐
│  Cloud CDN           │      │  Cloud Run         │
│  (Frontend Assets)   │      │  (Backend API)     │
│                      │      │  - Node.js/Express │
│  - React Build       │      │  - Auto-scaling    │
│  - Static Files      │      │  - HTTPS only      │
│  - Global Edge Cache │      └─────────┬──────────┘
└──────────────────────┘                │
                                        │
                          ┌─────────────┼─────────────┐
                          │             │             │
                ┌─────────▼──────┐  ┌──▼──────────┐  │
                │  Cloud SQL     │  │  Cloud      │  │
                │  (MySQL)       │  │  Storage    │  │
                │                │  │  (Files)    │  │
                │  - Private IP  │  └─────────────┘  │
                │  - Auto Backup │                   │
                │  - Replication │                   │
                └────────────────┘      ┌────────────▼──────┐
                                        │  Cloud NLP API    │
                                        │  (AI Validation)  │
                                        └───────────────────┘
```

---

**[SCREENSHOT 20: Real-time Dashboard Notifications]**
> **Description:** Screenshot of the admin dashboard with real-time updates showing:
> - Dashboard with recent activity section
> - Real-time notification toast/alert appearing:
>   - New submission notification with form name
>   - Timestamp of the event
>   - "View" action button
>   - Notification icon (bell or similar)
> - Activity feed updating in real-time:
>   - Latest submission entry appearing at top
>   - Form name and submitter info
>   - Time indicator ("just now", "2 minutes ago")
> - Visual indicator of WebSocket connection status (optional)
> - Counter badges updating (e.g., "New Submissions: 3")
> - AI flag notification if applicable

---

### 8.3 Environment Configuration

#### 8.3.1 Development Environment

**Backend:**
- Local Node.js server (port 5000)
- Local MySQL database or Cloud SQL dev instance
- Environment variables from `.env` file
- Hot reload with nodemon

**Frontend:**
- Vite dev server (port 5173)
- Hot module replacement (HMR)
- Proxy API requests to backend

**Commands:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

#### 8.3.2 Staging Environment

**Purpose:** Pre-production testing and QA

**Configuration:**
- Dedicated Cloud SQL instance
- Cloud Run service (staging)
- Separate Google Cloud project
- Limited resources (cost optimization)

**URL:** `https://staging.smartformvalidator.com`

---

#### 8.3.3 Production Environment

**Configuration:**
- High-availability Cloud SQL (multi-zone)
- Cloud Run with auto-scaling (1-100 instances)
- Cloud CDN for global distribution
- Cloud Monitoring and alerting
- Automated backups (daily)

**URL:** `https://smartformvalidator.com`

---

### 8.4 Containerization

#### 8.4.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
```

---

#### 8.4.2 Frontend Build Process

**Build Command:**
```bash
cd frontend
npm run build
# Outputs to dist/ directory
```

**Deployment:**
```bash
# Upload to Cloud Storage bucket
gsutil -m rsync -r -d dist/ gs://smartformvalidator-frontend/

# Set cache control
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" \
  gs://smartformvalidator-frontend/**
```

---

### 8.5 CI/CD Pipeline

#### 8.5.1 Pipeline Stages

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Code   │────>│   Build  │────>│   Test   │────>│  Deploy  │
│  Commit  │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                │
     │                │                 │                │
   Push to        Compile          Run tests      Deploy to
   GitHub         & Build          & Lint         staging/prod
```

---

#### 8.5.2 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main
      - staging

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies (backend)
        run: |
          cd backend
          npm ci
      
      - name: Run linter
        run: |
          cd backend
          npm run lint || true
      
      - name: Run tests
        run: |
          cd backend
          npm test || true

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Build and push Docker image
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT }}/smartform-backend
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy smartform-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/smartform-backend \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}" \
            --max-instances 10
      
      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy frontend to Cloud Storage
        run: |
          gsutil -m rsync -r -d frontend/dist/ gs://smartformvalidator-frontend/
```

---

### 8.6 Database Deployment

#### 8.6.1 Migration Strategy

**Initial Setup:**
```bash
# Run database initialization script
mysql -h CLOUD_SQL_IP -u root -p < backend/init-database.sql
```

**Schema Migrations:**
```javascript
// backend/migrations/add_ai_errors_column.sql
ALTER TABLE submission_data
ADD COLUMN ai_errors TEXT NULL;
```

**Migration Execution:**
```bash
# Apply migration
mysql -h CLOUD_SQL_IP -u root -p db_smartform < backend/migrations/add_ai_errors_column.sql
```

---

#### 8.6.2 Backup Strategy

**Automated Backups:**
- Cloud SQL automatic backups (daily at 3 AM UTC)
- Retention: 7 days
- Point-in-time recovery enabled

**Manual Backups:**
```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=smart-form-db \
  --description="Pre-release backup"
```

---

### 8.7 Monitoring and Logging

#### 8.7.1 Application Monitoring

**Metrics Tracked:**
- Request rate and latency
- Error rate (4xx, 5xx)
- Database connection pool usage
- API response times
- AI API call volume and cost
- WebSocket connections

**Alerts:**
- Error rate > 5% for 5 minutes
- Response time > 2 seconds (p95)
- Database CPU > 80%
- Memory usage > 90%

---

#### 8.7.2 Logging Strategy

**Log Levels:**
- ERROR: Application errors, exceptions
- WARN: Warning conditions, AI validation failures
- INFO: General information, API requests
- DEBUG: Detailed debugging information (dev only)

**Log Aggregation:**
- Cloud Logging for centralized logs
- Structured JSON logging format
- Log retention: 30 days

**Example Log Entry:**
```json
{
  "timestamp": "2025-12-18T10:00:00Z",
  "level": "INFO",
  "message": "Form submission received",
  "metadata": {
    "form_id": 1,
    "user_id": 5,
    "ip_address": "192.168.1.100",
    "has_ai_validation": true
  }
}
```

---

### 8.8 Scaling Strategy

#### 8.8.1 Horizontal Scaling

**Cloud Run Auto-scaling:**
- Min instances: 1
- Max instances: 100
- Concurrency: 80 requests per instance
- Scale-up threshold: CPU > 60% or requests queued
- Scale-down: Gradual after 15 min idle

---

#### 8.8.2 Database Scaling

**Vertical Scaling:**
- Start: db-n1-standard-1 (1 vCPU, 3.75 GB RAM)
- Scale up to: db-n1-standard-4 (4 vCPUs, 15 GB RAM)

**Read Replicas:**
- Add read replica for analytics queries
- Route read-only queries to replica
- Reduces load on primary instance

**Connection Pooling:**
- Max connections: 100
- Connection timeout: 30s
- Idle timeout: 10min

---

### 8.9 Disaster Recovery

#### 8.9.1 Recovery Objectives

- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

---

#### 8.9.2 Recovery Procedures

**Database Failure:**
1. Promote read replica to primary
2. Update application connection string
3. Verify data integrity
4. Create new read replica

**Application Failure:**
1. Rollback to previous Cloud Run revision
2. Investigate root cause
3. Fix and redeploy

**Complete Disaster:**
1. Restore database from backup
2. Redeploy application containers
3. Restore static assets from backup
4. Update DNS if necessary

---

## 9. Appendices

### 9.1 Glossary

- **Form Field**: Individual input element within a form
- **Submission**: A completed form filled out by a user
- **AI Validation**: Automated analysis using Google NLP API
- **Sentiment Score**: Numeric value (-1.0 to 1.0) indicating emotional tone
- **Entity**: Named item extracted from text (person, place, organization)
- **Account**: Multi-tenant organizational unit
- **Group**: Collection of users for collaboration

---

### 9.2 References

1. Google Cloud Natural Language API: https://cloud.google.com/natural-language
2. Express.js Documentation: https://expressjs.com
3. React Documentation: https://react.dev
4. Sequelize ORM: https://sequelize.org
5. Socket.IO Documentation: https://socket.io
6. JWT RFC 7519: https://tools.ietf.org/html/rfc7519
7. OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749

---

### 9.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 18, 2025 | Development Team | Complete SDD documentation |

---

**End of Software Design Document - Part 3**
