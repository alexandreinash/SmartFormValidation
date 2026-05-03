# Software Design Document (SDD) - Part 2
## Smart Form Validator with AI Integration

---

## 5. Component Design

### 5.1 Backend Components

#### 5.1.1 Server Core (server.js)

**Purpose**: Application entry point, server initialization, middleware configuration

**Responsibilities:**
- Initialize Express application
- Configure security middleware (Helmet, CORS)
- Set up Socket.IO WebSocket server
- Register API routes
- Database connection and synchronization
- Global error handling
- Health check endpoint

**Key Dependencies:**
- Express.js (web framework)
- Socket.IO (real-time communication)
- Sequelize (database ORM)
- Helmet (security headers)
- CORS (cross-origin support)

**Configuration:**
```javascript
Environment Variables:
- PORT: Server port (default: 5000)
- FRONTEND_URL: CORS allowed origin
- DATABASE_URL: MySQL connection string
- GCLOUD_NLP_ENABLED: Enable AI validation
- EMAIL_ENABLED: Enable email notifications
```

**API Routes:**
- `/api/health` - Health check
- `/api/auth` - Authentication endpoints
- `/api/forms` - Form management
- `/api/submissions` - Form submissions
- `/api/analytics` - Analytics data
- `/api/groups` - Group management
- `/api/accounts` - Account management
- `/api/audit` - Audit logs

**WebSocket Events:**
- `connection`: New client connection
- `join-admin-room`: Subscribe to admin updates
- `join-form-room`: Subscribe to form-specific updates
- `disconnect`: Client disconnection

---

#### 5.1.2 Database Layer (sequelize.js)

**Purpose**: Database connection and ORM configuration

**Responsibilities:**
- Establish MySQL connection
- Configure Sequelize instance
- Connection pooling
- Query logging (development mode)

**Configuration:**
```javascript
Database Connection Pool:
- max: 10 connections
- min: 0 connections
- acquire: 30000ms timeout
- idle: 10000ms timeout
```

**Connection String Format:**
```
mysql://username:password@host:port/database
```

---

#### 5.1.3 Models

##### User Model (models/User.js)

**Purpose**: Represents system users

**Attributes:**
- `id`: Primary key (auto-increment)
- `username`: Display name
- `email`: Unique email address
- `password`: Bcrypt hashed password
- `role`: ENUM('admin', 'user')
- `account_id`: Foreign key to parent account
- `is_account_owner`: Boolean flag
- `created_at`: Registration timestamp

**Associations:**
- Self-referential: User hasMany Users (account structure)
- User hasMany Forms (created forms)
- User hasMany Submissions (submitted forms)
- User hasMany GroupMembers (group memberships)
- User hasMany AuditLogs (activity logs)

**Methods:**
- `validatePassword(password)`: Compare password hash
- `toJSON()`: Exclude password from serialization

---

##### Form Model (models/Form.js)

**Purpose**: Represents form definitions

**Attributes:**
- `id`: Primary key
- `title`: Form title
- `created_by`: Creator user ID
- `account_id`: Account owner ID
- `created_at`: Creation timestamp

**Associations:**
- Form belongsTo User (creator)
- Form belongsTo User (account)
- Form hasMany FormFields
- Form hasMany Submissions
- Form hasMany FormPermissions

---

##### FormField Model (models/FormField.js)

**Purpose**: Represents individual form fields

**Attributes:**
- `id`: Primary key
- `form_id`: Parent form ID
- `label`: Field label
- `type`: Field type (text, email, number, etc.)
- `is_required`: Required flag
- `ai_validation_enabled`: Enable AI validation
- `expected_entity`: Expected NLP entity
- `expected_sentiment`: Expected sentiment
- `options`: JSON options for select/checkbox

**Field Types:**
- text: Single-line text input
- email: Email address input
- number: Numeric input
- textarea: Multi-line text input
- phone: Phone number input
- date: Date picker
- select: Dropdown selection
- checkbox: Checkbox group
- file: File upload

**AI Validation Options:**
- Entity Types: PERSON, LOCATION, ORGANIZATION, EVENT, WORK_OF_ART, CONSUMER_GOOD, OTHER, PHONE_NUMBER, ADDRESS, DATE, NUMBER, PRICE
- Sentiment Types: positive, negative, neutral, mixed, any

---

##### Submission Model (models/Submission.js)

**Purpose**: Represents form submission instances

**Attributes:**
- `id`: Primary key
- `form_id`: Form being submitted
- `submitted_by`: Submitter user ID (nullable)
- `submitted_at`: Submission timestamp

**Associations:**
- Submission belongsTo Form
- Submission belongsTo User (submitter)
- Submission hasMany SubmissionData

---

##### SubmissionData Model (models/SubmissionData.js)

**Purpose**: Stores individual field values with AI validation results

**Attributes:**
- `id`: Primary key
- `submission_id`: Parent submission ID
- `field_id`: Form field ID
- `value`: User input value
- `ai_sentiment_flag`: Sentiment mismatch detected
- `ai_entity_flag`: Entity mismatch detected
- `ai_not_evaluated`: AI validation skipped
- `ai_errors`: JSON array of error details

**AI Error Structure:**
```json
[
  {
    "type": "sentiment_mismatch",
    "issue": "Expected positive sentiment, found negative",
    "correction": "Consider rephrasing more positively",
    "severity": "warning"
  },
  {
    "type": "entity_mismatch",
    "issue": "Expected PERSON entity, found LOCATION",
    "correction": "Please provide a person's name",
    "severity": "error"
  }
]
```

---

##### Group Model (models/Group.js)

**Purpose**: Represents collaboration groups

**Attributes:**
- `id`: Primary key
- `name`: Group name
- `description`: Group description
- `created_by`: Creator user ID
- `account_id`: Account owner ID
- `created_at`: Creation timestamp

**Associations:**
- Group belongsTo User (creator)
- Group hasMany GroupMembers
- Group hasMany FormPermissions

---

##### GroupMember Model (models/GroupMember.js)

**Purpose**: Represents group membership

**Attributes:**
- `id`: Primary key
- `group_id`: Group ID
- `user_id`: User ID
- `role`: ENUM('owner', 'admin', 'member')
- `joined_at`: Join timestamp

**Member Roles:**
- owner: Full control, can delete group
- admin: Can manage members and permissions
- member: Can access shared forms

---

##### FormPermission Model (models/FormPermission.js)

**Purpose**: Fine-grained form access control

**Attributes:**
- `id`: Primary key
- `form_id`: Form ID
- `group_id`: Group ID
- `permission_type`: ENUM('view', 'edit', 'submit')
- `granted_at`: Grant timestamp

---

##### PasswordReset Model (models/PasswordReset.js)

**Purpose**: Token-based password recovery

**Attributes:**
- `id`: Primary key
- `user_id`: User ID
- `token`: Unique reset token
- `expires_at`: Expiration timestamp
- `created_at`: Creation timestamp
- `used`: Token usage flag

**Token Generation:**
- Random 32-byte hex string
- Valid for 1 hour from creation
- One-time use only

---

##### AuditLog Model (models/AuditLog.js)

**Purpose**: System activity tracking

**Attributes:**
- `id`: Primary key
- `user_id`: User performing action
- `action`: Action description
- `entity_type`: Affected entity type
- `entity_id`: Affected entity ID
- `details`: JSON additional details
- `ip_address`: Client IP address
- `created_at`: Log timestamp

**Logged Actions:**
- USER_LOGIN, USER_LOGOUT, USER_REGISTER
- FORM_CREATED, FORM_UPDATED, FORM_DELETED
- FORM_SUBMITTED, SUBMISSION_VIEWED
- GROUP_CREATED, GROUP_UPDATED, GROUP_DELETED
- MEMBER_ADDED, MEMBER_REMOVED
- PERMISSION_GRANTED, PERMISSION_REVOKED

---

#### 5.1.4 Controllers

##### authController.js

**Purpose**: Handle authentication and authorization

**Endpoints:**

**POST /api/auth/register**
- Request Body: `{ username, email, password, role }`
- Validates email format and password strength
- Hashes password with bcrypt (10 rounds)
- Creates user record
- Returns JWT token and user data
- Logs USER_REGISTER audit event

**POST /api/auth/login**
- Request Body: `{ email, password }`
- Verifies email and password
- Generates JWT token (expires in 7 days)
- Returns token and user data
- Logs USER_LOGIN audit event

**POST /api/auth/google**
- Request Body: `{ credential }`
- Verifies Google OAuth token
- Creates or retrieves user account
- Returns JWT token and user data
- Handles role selection for new users

**POST /api/auth/forgot-password**
- Request Body: `{ email }`
- Generates password reset token
- Sends reset email via emailService
- Returns success message

**POST /api/auth/reset-password**
- Request Body: `{ token, newPassword }`
- Validates reset token (not expired, not used)
- Updates user password
- Marks token as used
- Returns success message

**GET /api/auth/me**
- Requires JWT authentication
- Returns current user data
- Used for session validation

---

##### formController.js

**Purpose**: Form CRUD operations

**Endpoints:**

**GET /api/forms**
- Query params: `account_id` (optional)
- Returns list of forms accessible to user
- Includes field count and submission count
- Filters by account for multi-tenancy

**GET /api/forms/:id**
- Returns complete form with all fields
- Validates user access permissions
- Includes AI validation configuration

**POST /api/forms**
- Request Body: `{ title, fields[] }`
- Validates form structure
- Creates form and associated fields atomically
- Returns created form with ID
- Logs FORM_CREATED audit event

**PUT /api/forms/:id**
- Request Body: `{ title, fields[] }`
- Validates ownership or admin role
- Updates form and fields
- Handles field additions/deletions
- Logs FORM_UPDATED audit event

**DELETE /api/forms/:id**
- Validates ownership or admin role
- Cascades deletion to fields and submissions
- Logs FORM_DELETED audit event

**POST /api/forms/:id/share**
- Request Body: `{ group_id, permission_type }`
- Creates form permission record
- Notifies group members (WebSocket)

---

**[SCREENSHOT 7: Form Fill/Submission Page]**
> **Description:** Screenshot of a user filling out a form showing:
> - Form title at the top (e.g., "Customer Feedback Form")
> - Multiple form fields with different types:
>   - Text input (e.g., Name field)
>   - Email input (e.g., Email field)
>   - Textarea (e.g., Feedback/Comments field)
>   - Number input (e.g., Rating field)
>   - Date picker (e.g., Date field)
>   - Dropdown/Select (e.g., Category selection)
> - Required field indicators (*)
> - AI validation indicator/icon on AI-enabled fields
> - Form validation messages if applicable
> - "Submit" button at the bottom
> - "Cancel" or "Clear" button

---

##### submissionController.js

**Purpose**: Handle form submissions with AI validation

**Endpoints:**

**POST /api/submissions**
- Request Body: `{ form_id, data: { field_id: value } }`
- Validates required fields
- Performs AI validation if enabled
  - Analyzes sentiment (Google NLP)
  - Extracts entities (Google NLP)
  - Compares against expected values
  - Generates error messages and corrections
- Creates submission and submission_data records
- Broadcasts new submission via WebSocket
- Returns submission ID and AI validation results
- Logs FORM_SUBMITTED audit event

**AI Validation Process:**
```javascript
For each field with ai_validation_enabled:
1. Call googleNlp.analyzeSentiment(value)
2. Call googleNlp.analyzeEntities(value)
3. Compare results with expected_sentiment and expected_entity
4. Generate user-friendly error messages
5. Store flags and errors in submission_data
6. Return comprehensive validation feedback
```

---

**[SCREENSHOT 8: AI Validation Feedback/Warnings]**
> **Description:** Screenshot of form submission with AI validation warnings showing:
> - Form with filled data
> - AI validation warning/error box highlighting issues:
>   - Warning icon (triangle or exclamation mark)
>   - Sentiment mismatch message (e.g., "Expected positive sentiment, found negative")
>   - Entity mismatch message (e.g., "Expected PERSON entity, found LOCATION")
>   - AI suggestion/correction text (e.g., "Consider rephrasing more positively")
> - Affected field(s) highlighted or marked
> - Options to:
>   - Edit the response
>   - Submit anyway (override)
>   - Cancel submission
> - Color-coded severity (warning yellow/orange, error red)

---

**[SCREENSHOT 9: Submission Success Confirmation]**
> **Description:** Screenshot of successful form submission showing:
> - Success message (e.g., "Form submitted successfully!")
> - Green checkmark or success icon
> - Submission ID or reference number
> - Timestamp of submission
> - Options to:
>   - Submit another response
>   - View submissions (if admin)
>   - Return to dashboard
> - Summary of submitted data (optional)

---

**GET /api/submissions**
- Query params: `form_id` (required), `flagged_only` (optional)
- Requires admin role
- Returns submissions with field values
- Includes AI validation flags
- Supports filtering by flagged submissions

**GET /api/submissions/:id**
- Requires admin role or submitter
- Returns detailed submission data
- Includes AI validation details and errors

**DELETE /api/submissions/:id**
- Requires admin role
- Cascades deletion to submission_data
- Logs SUBMISSION_DELETED audit event

---

**[SCREENSHOT 10: Submissions List/Management Page]**
> **Description:** Screenshot of the submissions management page showing:
> - Page title "Form Submissions" or "All Submissions"
> - Filter options:
>   - Filter by form (dropdown)
>   - Filter by date range (date pickers)
>   - Filter by AI flags (checkbox or toggle)
> - Table displaying submissions with columns:
>   - Submission ID
>   - Form name
>   - Submitted by (user email or "Anonymous")
>   - Submission date/time
>   - AI flags status (icon or badge indicating flagged items)
>   - Actions (View, Delete, Export)
> - Pagination controls
> - Export buttons (CSV, PDF, Excel)
> - Total submission count

---

**[SCREENSHOT 11: Individual Submission Detail View]**
> **Description:** Screenshot of a single submission's detail page showing:
> - Submission header with:
>   - Form title
>   - Submission ID
>   - Submitted by (user info)
>   - Submission timestamp
> - All field responses displayed as read-only:
>   - Field label and value pairs
>   - For AI-validated fields:
>     - AI validation status (passed/flagged)
>     - Warning/error badges if flagged
>     - Specific AI error details (sentiment/entity mismatches)
> - Action buttons (Delete, Export, Mark as Reviewed)
> - Back to submissions list button

---

##### analyticsController.js

**Purpose**: Generate analytics and reports

**Endpoints:**

**GET /api/analytics/overview**
- Requires admin role
- Returns dashboard statistics:
  - Total forms created
  - Total submissions received
  - Submissions this month
  - AI flagged submissions count
  - Submission trends (daily/weekly/monthly)
  - Top forms by submission count
  - AI validation flag rates

**GET /api/analytics/forms/:id**
- Requires admin role
- Returns form-specific analytics:
  - Total submissions
  - Submission timeline
  - Field-level statistics
  - AI validation insights
  - Common validation issues

**GET /api/analytics/export**
- Query params: `form_id`, `start_date`, `end_date`, `format`
- Generates data export (CSV/JSON)
- Includes all submissions and AI flags
- Streams large datasets

---

**[SCREENSHOT 12: Analytics Dashboard Page]**
> **Description:** Screenshot of the analytics page showing:
> - Page title "Analytics" or "Form Analytics"
> - Time range selector (Last 7 days, Last 30 days, Custom range)
> - Key metrics cards:
>   - Total submissions with trend indicator
>   - AI validation rate (percentage)
>   - Average response time
>   - Forms with most submissions
> - Charts/graphs:
>   - Submissions over time (line or bar chart)
>   - AI flags by type (pie or donut chart showing sentiment vs entity mismatches)
>   - Form performance comparison (bar chart)
> - Tables:
>   - Top performing forms
>   - Most flagged fields
> - Export analytics button

---

##### groupController.js

**Purpose**: Manage collaboration groups

**Endpoints:**

**GET /api/groups**
- Returns groups user is member of
- Includes member count and role

**POST /api/groups**
- Request Body: `{ name, description }`
- Creates group with creator as owner
- Returns created group

**PUT /api/groups/:id**
- Request Body: `{ name, description }`
- Requires owner or admin role
- Updates group details

**DELETE /api/groups/:id**
- Requires owner role
- Cascades deletion to members and permissions

**POST /api/groups/:id/members**
- Request Body: `{ user_id, role }`
- Requires admin role
- Adds user to group
- Logs MEMBER_ADDED audit event

**DELETE /api/groups/:id/members/:userId**
- Requires admin role or self-removal
- Removes user from group
- Logs MEMBER_REMOVED audit event

---

**[SCREENSHOT 13: Groups Management Page]**
> **Description:** Screenshot of the groups page showing:
> - Page title "Groups" or "Manage Groups"
> - "Create New Group" button
> - List/grid of groups displaying:
>   - Group name
>   - Group description
>   - Number of members
>   - Created date
>   - Created by (user)
>   - Action buttons (View, Edit, Delete)
> - For each group card:
>   - Members count badge
>   - Shared forms count badge
> - Search/filter functionality

---

**[SCREENSHOT 14: Group Details/Members Page]**
> **Description:** Screenshot of a specific group's detail page showing:
> - Group name and description at top
> - "Add Members" button
> - "Share Form with Group" button
> - Members section with table/list:
>   - Member name/email
>   - Role (Owner, Admin, Member)
>   - Join date
>   - Action buttons (Change Role, Remove)
> - Shared forms section with list:
>   - Form title
>   - Permission type (View, Edit, Submit)
>   - Shared date
>   - Action buttons (Modify, Revoke)
> - Group settings/edit options

---

##### accountController.js

**Purpose**: Multi-tenant account management

**Endpoints:**

**GET /api/accounts/:id/users**
- Requires account owner
- Returns list of users in account
- Includes user roles and status

**POST /api/accounts/:id/users**
- Request Body: `{ email, role }`
- Requires account owner
- Invites user to account
- Sends invitation email

**PUT /api/accounts/:id/users/:userId**
- Request Body: `{ role }`
- Requires account owner
- Updates user role within account

**DELETE /api/accounts/:id/users/:userId**
- Requires account owner
- Removes user from account
- Reassigns or transfers owned resources

---

#### 5.1.5 Middleware

##### auth.js

**Purpose**: JWT authentication and authorization

**Functions:**

**verifyToken(req, res, next)**
- Extracts JWT from Authorization header
- Verifies token signature and expiration
- Decodes user information
- Attaches `req.user` object
- Returns 401 if invalid/missing token

**requireRole(role)**
- Higher-order function for role checking
- Validates `req.user.role` matches required role
- Returns 403 if insufficient permissions
- Usage: `requireRole('admin')`

**optionalAuth(req, res, next)**
- Attempts JWT verification
- Continues without error if token missing
- Used for public endpoints with optional user context

---

##### rateLimiter.js

**Purpose**: API rate limiting and DoS protection

**Limiters:**

**apiLimiter**
- Applies to all `/api/*` routes
- Limit: 100 requests per 15 minutes per IP
- Returns 429 Too Many Requests on exceed

**authLimiter**
- Applies to authentication endpoints
- Limit: 5 requests per 15 minutes per IP
- Prevents brute force attacks

**submissionLimiter**
- Applies to form submission endpoint
- Limit: 10 submissions per 15 minutes per IP
- Prevents spam submissions

**Configuration:**
```javascript
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
}
```

---

#### 5.1.6 Services

##### googleNlp.js

**Purpose**: Google Cloud Natural Language API integration

**Functions:**

**analyzeSentiment(text)**
- Calls Google NLP analyzeSentiment API
- Returns: `{ score: number, magnitude: number }`
- Score range: -1.0 (negative) to 1.0 (positive)
- Magnitude: Emotional intensity (0.0+)
- Returns neutral values if AI disabled

**analyzeEntities(text)**
- Calls Google NLP analyzeEntities API
- Returns: `{ entities: [{ name, type, salience }] }`
- Entity types: PERSON, LOCATION, ORGANIZATION, etc.
- Salience: Entity importance (0.0 to 1.0)
- Returns empty array if AI disabled

**analyzeSyntax(text)**
- Calls Google NLP analyzeSyntax API
- Returns: `{ sentences: [], tokens: [] }`
- Used for advanced grammar checking
- Provides part-of-speech tagging

**comprehensiveValidation(text, expectedEntity, expectedSentiment)**
- Performs all NLP analyses
- Compares results with expectations
- Generates detailed error messages
- Returns: `{ errors: [], suggestions: [] }`
- Error types:
  - sentiment_mismatch
  - entity_mismatch
  - grammar_issues
  - tone_inappropriate

**Error Message Generation:**
```javascript
Sentiment Mismatch Example:
{
  type: 'sentiment_mismatch',
  issue: 'Expected positive sentiment, found negative (-0.7)',
  correction: 'Try using more positive language, e.g., "I enjoyed..." instead of "I disliked..."',
  severity: 'warning'
}

Entity Mismatch Example:
{
  type: 'entity_mismatch',
  issue: 'Expected PERSON entity, found LOCATION (Paris)',
  correction: 'Please provide a person\'s name, such as "John Smith"',
  severity: 'error'
}
```

**Configuration:**
- Uses `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Requires service account JSON key file
- Lazily initializes client to avoid import errors
- Gracefully degrades if API unavailable

---

##### emailService.js

**Purpose**: Email notification handling

**Functions:**

**sendPasswordResetEmail(email, resetToken)**
- Generates password reset email
- Includes reset link with token
- Uses HTML email template
- Sends via configured SMTP server

**sendAccountInvitation(email, inviterName, accountName)**
- Sends account invitation email
- Includes registration link
- Personalized with inviter details

**sendFormShareNotification(email, formTitle, sharedBy)**
- Notifies user of shared form
- Includes form access link
- Sender information

**Configuration:**
```javascript
SMTP Settings:
- SMTP_HOST: Mail server hostname
- SMTP_PORT: Mail server port (587/465)
- SMTP_USER: Authentication username
- SMTP_PASS: Authentication password
- SMTP_FROM: From email address
- EMAIL_ENABLED: Enable/disable emails
```

**Transporter:**
- Uses Nodemailer library
- Supports SendGrid, AWS SES, Gmail, etc.
- Connection pooling for performance
- TLS encryption

---

##### auditLogger.js

**Purpose**: System activity audit trail

**Functions:**

**log(userId, action, entityType, entityId, details, ipAddress)**
- Creates audit log entry
- Normalizes action names
- Stores additional context as JSON
- Non-blocking (doesn't fail requests)

**queryLogs(filters)**
- Retrieves audit logs with filtering
- Filters: user_id, action, entity_type, date_range
- Pagination support
- Returns sorted by created_at DESC

**Common Actions:**
- Authentication: USER_LOGIN, USER_LOGOUT, USER_REGISTER
- Forms: FORM_CREATED, FORM_UPDATED, FORM_DELETED, FORM_VIEWED
- Submissions: FORM_SUBMITTED, SUBMISSION_VIEWED, SUBMISSION_DELETED
- Groups: GROUP_CREATED, MEMBER_ADDED, MEMBER_REMOVED
- Permissions: PERMISSION_GRANTED, PERMISSION_REVOKED
- Accounts: USER_INVITED, USER_ROLE_CHANGED

**Usage Example:**
```javascript
auditLogger.log(
  req.user.id,
  'FORM_CREATED',
  'form',
  newForm.id,
  { title: newForm.title, fields_count: fields.length },
  req.ip
);
```

---

**[SCREENSHOT 15: Audit Logs Page]**
> **Description:** Screenshot of the audit logs/activity page showing:
> - Page title "Audit Logs" or "Activity History"
> - Filter options:
>   - Filter by user (dropdown or search)
>   - Filter by action type (Login, Form Created, Submission, etc.)
>   - Filter by date range (date pickers)
>   - Filter by entity type (User, Form, Group, etc.)
> - Table displaying audit entries with columns:
>   - Timestamp (date and time)
>   - User (who performed the action)
>   - Action (description of what was done)
>   - Entity Type (Form, Submission, Group, etc.)
>   - Entity ID/Name
>   - IP Address
>   - Details (expandable or view button)
> - Pagination controls
> - Export logs button
> - Real-time updates indicator if WebSocket is active

---

### 5.2 Frontend Components

#### 5.2.1 Application Core

##### App.jsx

**Purpose**: Main application component and routing

**Responsibilities:**
- Configure React Router routes
- Google OAuth provider setup
- Layout management
- Authentication route handling
- Navigation structure

**Routes:**
- `/` - HomePage (landing page)
- `/login` - LoginPage
- `/register` - RegisterPage
- `/forgot-password` - ForgotPasswordPage
- `/reset-password` - ResetPasswordPage
- `/admin` - AdminDashboard
- `/admin/create-form` - CreateFormPage
- `/admin/forms/:id/edit` - EditFormPage
- `/admin/forms/:id/submissions` - FormSubmissionsPage
- `/admin/analytics` - AnalyticsPage
- `/admin/groups` - ManageGroupsPage
- `/admin/users` - ManageUsersPage
- `/forms/:id` - FormFillPage (public)
- `/user/forms` - UserFormSelectionPage

**Layout Logic:**
- Auth pages: Centered layout without navigation
- Admin pages: Full dashboard layout with sidebar
- Form pages: Clean, focused layout

---

##### AuthContext.jsx

**Purpose**: Global authentication state management

**State:**
- `user`: Current user object or null
- `isAuthenticated`: Boolean authentication status
- `isLoading`: Loading state during auth checks

**Methods:**
- `login(email, password)`: Authenticate user
- `logout()`: Clear session and redirect
- `register(userData)`: Create new account
- `googleLogin(credential)`: OAuth authentication
- `checkAuth()`: Validate existing session

**Storage:**
- JWT token stored in localStorage
- Automatic token refresh on page load
- Token expiration handling

**Context Provider:**
```jsx
<AuthContext.Provider value={{ user, login, logout, register }}>
  {children}
</AuthContext.Provider>
```

**Usage in Components:**
```jsx
const { user, isAuthenticated, login } = useAuth();
```

---

##### api.js

**Purpose**: Centralized API client configuration

**Features:**
- Axios instance with base URL
- Automatic JWT token attachment
- Request/response interceptors
- Error handling and transformation
- Token refresh logic

**Configuration:**
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: Add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**API Methods:**
- `api.get(url, config)`
- `api.post(url, data, config)`
- `api.put(url, data, config)`
- `api.delete(url, config)`

---

#### 5.2.2 Page Components

##### HomePage.jsx

**Purpose**: Landing page for visitors

**Features:**
- Marketing content and value proposition
- Call-to-action buttons (Login, Register)
- Feature highlights
- System overview

---

##### LoginPage.jsx

**Purpose**: User authentication

**Features:**
- Email/password login form
- Google OAuth sign-in button
- Form validation (email format, required fields)
- Error message display
- "Forgot Password" link
- "Register" link

**Form Handling:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await login(email, password);
    navigate('/admin'); // Redirect on success
  } catch (error) {
    setError(error.response?.data?.message || 'Login failed');
  }
};
```

---

##### RegisterPage.jsx

**Purpose**: New user registration

**Features:**
- Registration form (username, email, password, role)
- Password strength indicator
- Email validation
- Role selection (admin/user)
- Google OAuth registration
- Terms acceptance checkbox

**Validation Rules:**
- Email: Valid format
- Password: Minimum 8 characters
- Username: Required, 3-50 characters
- Role: Required selection

---

##### ForgotPasswordPage.jsx

**Purpose**: Password reset request

**Features:**
- Email input form
- Reset link email sending
- Success confirmation message
- Resend functionality (rate limited)

---

##### ResetPasswordPage.jsx

**Purpose**: Password reset completion

**Features:**
- New password input form
- Password confirmation field
- Token validation
- Expiration handling
- Success redirect to login

---

##### AdminDashboard.jsx

**Purpose**: Main admin control panel

**Features:**
- Statistics overview cards
  - Total forms created
  - Total submissions
  - Submissions this month
  - AI flagged submissions
- Quick action buttons
  - Create New Form
  - View All Forms
  - View All Submissions
  - Analytics Dashboard
- Recent activity feed
- Real-time updates via WebSocket

**WebSocket Integration:**
```jsx
useEffect(() => {
  const socket = io(API_BASE_URL);
  socket.emit('join-admin-room');
  
  socket.on('new-submission', (data) => {
    // Update statistics
    setStats(prev => ({
      ...prev,
      totalSubmissions: prev.totalSubmissions + 1
    }));
    // Show notification
    showNotification('New submission received');
  });
  
  return () => socket.disconnect();
}, []);
```

---

##### CreateFormPage.jsx

**Purpose**: Form builder interface

**Features:**
- Form title input
- Dynamic field addition/removal
- Field configuration panel:
  - Label
  - Type selection (dropdown)
  - Required checkbox
  - AI validation toggle
  - Expected entity selection
  - Expected sentiment selection
  - Options editor (for select/checkbox)
- Field reordering (drag-and-drop)
- Preview mode
- Save and publish

**Field Configuration:**
```jsx
<FieldEditor>
  <Input name="label" placeholder="Field Label" />
  <Select name="type">
    <option value="text">Text</option>
    <option value="email">Email</option>
    <option value="number">Number</option>
    <option value="textarea">Textarea</option>
    <option value="phone">Phone</option>
    <option value="date">Date</option>
    <option value="select">Dropdown</option>
    <option value="checkbox">Checkbox</option>
    <option value="file">File Upload</option>
  </Select>
  <Checkbox name="is_required">Required</Checkbox>
  <Checkbox name="ai_validation_enabled">Enable AI Validation</Checkbox>
  {aiEnabled && (
    <>
      <Select name="expected_entity">{/* Entity options */}</Select>
      <Select name="expected_sentiment">{/* Sentiment options */}</Select>
    </>
  )}
</FieldEditor>
```

---

##### EditFormPage.jsx

**Purpose**: Modify existing forms

**Features:**
- Load existing form data
- Same field editor as CreateFormPage
- Handle field updates/deletions
- Warning for forms with existing submissions
- Version history (future enhancement)

---

##### FormListPage.jsx / UserFormSelectionPage.jsx

**Purpose**: Browse and select forms

**Features:**
- Grid or list view toggle
- Search and filtering
  - By title
  - By type (text, email, number, quiz)
  - By creation date
- Form cards showing:
  - Title
  - Field count
  - Submission count
  - Creation date
  - AI validation status
- Action buttons:
  - Fill Form (users)
  - View Submissions (admins)
  - Edit Form (admins)
  - Delete Form (admins)
- Pagination

---

##### FormFillPage.jsx

**Purpose**: End-user form submission

**Features:**
- Dynamic form rendering based on field types
- Real-time validation
  - Required field checks
  - Format validation (email, phone, etc.)
  - Range validation (numbers, dates)
- AI validation feedback display
- Progress indicator for multi-step forms
- File upload handling
- Submission confirmation
- Error message display with corrections

**Validation Display:**
```jsx
{aiErrors.length > 0 && (
  <ValidationFeedback>
    {aiErrors.map((error, index) => (
      <ErrorMessage key={index} severity={error.severity}>
        <strong>{error.type}:</strong> {error.issue}
        {error.correction && (
          <Suggestion>💡 {error.correction}</Suggestion>
        )}
      </ErrorMessage>
    ))}
  </ValidationFeedback>
)}
```

**Submission Flow:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Client-side validation
  const validationErrors = validateForm(formData);
  if (validationErrors.length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  // Submit to API
  try {
    const response = await api.post('/submissions', {
      form_id: formId,
      data: formData
    });
    
    // Handle AI validation results
    if (response.data.aiErrors && response.data.aiErrors.length > 0) {
      setAiErrors(response.data.aiErrors);
      setShowAiWarning(true);
    } else {
      // Success redirect
      navigate('/success');
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Submission failed');
  }
};
```

---

##### FormSubmissionsPage.jsx

**Purpose**: View and analyze form submissions (Admin)

**Features:**
- Submission list with filters
  - By date range
  - By AI flags (flagged only)
  - By submitter
- Submission detail view
- AI validation flag indicators
- Bulk actions:
  - Export (CSV/JSON)
  - Delete selected
  - Mark as reviewed
- Submission statistics
- Real-time updates via WebSocket

**Submission Card:**
```jsx
<SubmissionCard flagged={submission.hasAiFlags}>
  <Header>
    <SubmissionId>#{submission.id}</SubmissionId>
    <Timestamp>{formatDate(submission.submitted_at)}</Timestamp>
    {submission.hasAiFlags && <FlagIcon />}
  </Header>
  <FieldValues>
    {submission.data.map(field => (
      <Field key={field.id}>
        <Label>{field.label}:</Label>
        <Value>{field.value}</Value>
        {field.ai_errors && (
          <AIErrors>{field.ai_errors}</AIErrors>
        )}
      </Field>
    ))}
  </FieldValues>
  <Actions>
    <Button onClick={() => viewDetails(submission.id)}>Details</Button>
    <Button onClick={() => deleteSubmission(submission.id)}>Delete</Button>
  </Actions>
</SubmissionCard>
```

---

##### AnalyticsPage.jsx

**Purpose**: Data visualization and insights

**Features:**
- Charts and graphs:
  - Submission timeline (line chart)
  - Forms by submission count (bar chart)
  - AI flag rate (pie chart)
  - Sentiment distribution (stacked bar)
- Key metrics cards
- Date range selector
- Export reports
- Drill-down capabilities

**Chart Libraries:**
- Recharts or Chart.js for visualizations
- CSV export functionality

---

##### ManageGroupsPage.jsx

**Purpose**: Group collaboration management

**Features:**
- Group list with search
- Create new group form
- Group detail view:
  - Members list
  - Add/remove members
  - Change member roles
  - Shared forms list
- Group permissions management
- Delete group confirmation

---

##### ManageUsersPage.jsx

**Purpose**: User administration (Account owners)

**Features:**
- User list with filtering
- User detail view
- Add new users to account
- Change user roles
- Deactivate/remove users
- Activity history per user
- Bulk operations

---

#### 5.2.3 Reusable Components

##### GoogleSignInNotification.jsx

**Purpose**: Display Google OAuth status notifications

**Features:**
- Success message after Google sign-in
- Role selection prompt for new users
- Auto-dismiss after timeout

---

##### GoogleRoleSelectionModal.jsx

**Purpose**: Role selection for new Google users

**Features:**
- Modal dialog
- Admin/User role selection
- Description of each role
- Confirmation button

---

##### SendToModal.jsx

**Purpose**: Share form with groups

**Features:**
- Group selection dropdown
- Permission type selection (view/edit/submit)
- Share confirmation
- Success/error feedback

---

##### DeleteUsersModal.jsx

**Purpose**: Confirm user deletion

**Features:**
- Warning message
- List of users to be deleted
- Confirmation checkbox
- Cancel/Confirm buttons

---

##### RemoveAccountModal.jsx

**Purpose**: Confirm account removal

**Features:**
- Impact warning (data loss)
- Confirmation input field
- Cancel/Confirm buttons

---

##### ScrollToTopButton.jsx

**Purpose**: Quick navigation to page top

**Features:**
- Appears on scroll down
- Smooth scroll animation
- Fixed position button

---

#### 5.2.4 Hooks

##### useWebSocket.js

**Purpose**: Reusable WebSocket connection hook

**Features:**
- Automatic connection management
- Event subscription
- Reconnection logic
- Cleanup on unmount

**Usage:**
```jsx
const { socket, connected } = useWebSocket();

useEffect(() => {
  if (!socket) return;
  
  socket.emit('join-admin-room');
  
  socket.on('new-submission', (data) => {
    // Handle new submission
  });
  
  return () => {
    socket.off('new-submission');
  };
}, [socket]);
```

---

### 5.3 Component Interaction Diagrams

#### 5.3.1 User Authentication Flow

```
┌─────────┐          ┌──────────────┐          ┌────────────┐          ┌──────────┐
│ Browser │          │ LoginPage.jsx│          │ api.js     │          │ Backend  │
└────┬────┘          └──────┬───────┘          └─────┬──────┘          └────┬─────┘
     │                      │                        │                      │
     │  Enter credentials   │                        │                      │
     ├─────────────────────>│                        │                      │
     │                      │                        │                      │
     │                      │  POST /api/auth/login  │                      │
     │                      ├───────────────────────>│                      │
     │                      │                        │  Verify credentials  │
     │                      │                        ├─────────────────────>│
     │                      │                        │                      │
     │                      │                        │  Generate JWT token  │
     │                      │                        │<─────────────────────┤
     │                      │  { token, user }       │                      │
     │                      │<───────────────────────┤                      │
     │                      │                        │                      │
     │                      │  Store token in        │                      │
     │                      │  localStorage          │                      │
     │                      │                        │                      │
     │                      │  Update AuthContext    │                      │
     │                      │                        │                      │
     │  Redirect to /admin  │                        │                      │
     │<─────────────────────┤                        │                      │
     │                      │                        │                      │
```

#### 5.3.2 Form Creation and Submission Flow

```
┌────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────┐     ┌────────────┐
│ Admin  │     │ CreateFormPage  │     │ formController  │     │ Database │     │ WebSocket  │
└───┬────┘     └────────┬────────┘     └────────┬────────┘     └────┬─────┘     └─────┬──────┘
    │                   │                       │                   │                  │
    │ Design form       │                       │                   │                  │
    ├──────────────────>│                       │                   │                  │
    │                   │                       │                   │                  │
    │ Click "Save"      │                       │                   │                  │
    ├──────────────────>│                       │                   │                  │
    │                   │  POST /api/forms      │                   │                  │
    │                   ├──────────────────────>│                   │                  │
    │                   │                       │  INSERT form      │                  │
    │                   │                       ├──────────────────>│                  │
    │                   │                       │                   │                  │
    │                   │                       │  INSERT fields    │                  │
    │                   │                       ├──────────────────>│                  │
    │                   │                       │                   │                  │
    │                   │  { formId, fields }   │                   │                  │
    │                   │<──────────────────────┤                   │                  │
    │  Show success     │                       │                   │                  │
    │<──────────────────┤                       │                   │                  │
    │                   │                       │                   │                  │
    
┌────────┐     ┌──────────────┐     ┌────────────────────┐     ┌─────────────┐     ┌──────────┐
│  User  │     │ FormFillPage │     │ submissionController│     │ googleNlp   │     │ Database │
└───┬────┘     └──────┬───────┘     └──────────┬─────────┘     └──────┬──────┘     └────┬─────┘
    │                 │                        │                       │                  │
    │ Fill form       │                        │                       │                  │
    ├────────────────>│                        │                       │                  │
    │                 │                        │                       │                  │
    │ Submit          │                        │                       │                  │
    ├────────────────>│                        │                       │                  │
    │                 │  POST /api/submissions │                       │                  │
    │                 ├───────────────────────>│                       │                  │
    │                 │                        │  analyzeSentiment()   │                  │
    │                 │                        ├──────────────────────>│                  │
    │                 │                        │  { score, magnitude } │                  │
    │                 │                        │<──────────────────────┤                  │
    │                 │                        │                       │                  │
    │                 │                        │  analyzeEntities()    │                  │
    │                 │                        ├──────────────────────>│                  │
    │                 │                        │  { entities[] }       │                  │
    │                 │                        │<──────────────────────┤                  │
    │                 │                        │                       │                  │
    │                 │                        │  Compare expectations │                  │
    │                 │                        │                       │                  │
    │                 │                        │  INSERT submission    │                  │
    │                 │                        ├──────────────────────────────────────────>│
    │                 │                        │                       │                  │
    │                 │  { submissionId,       │                       │                  │
    │                 │    aiErrors[] }        │                       │                  │
    │                 │<───────────────────────┤                       │                  │
    │  Display AI     │                        │                       │                  │
    │  feedback       │                        │  Emit 'new-submission'│                  │
    │<────────────────┤                        ├──────────────────────>│                  │
    │                 │                        │                       │                  │
```

