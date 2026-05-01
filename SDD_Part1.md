# Software Design Document (SDD)
## Smart Form Validator with AI Integration

**Version:** 1.0  
**Date:** December 17, 2025  
**Project:** Smart Form Validation System  

---

## Document Control

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | Dec 17, 2025 | Development Team | Initial SDD Release |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [System Architecture](#3-system-architecture)
4. [Data Design](#4-data-design)
5. [Component Design](#5-component-design)
6. [Interface Design](#6-interface-design)
7. [Security Design](#7-security-design)
8. [Deployment Architecture](#8-deployment-architecture)

---

## 1. Introduction

### 1.1 Purpose
This Software Design Document (SDD) describes the architecture and detailed design of the Smart Form Validator system. It provides a comprehensive blueprint for developers, testers, and stakeholders to understand the system's structure, components, and interactions.

### 1.2 Scope
The Smart Form Validator is a web-based application that enables:
- Dynamic form creation and management by administrators
- End-user form submission with real-time validation
- AI-powered validation using Google Cloud Natural Language API
- Multi-tenant account management with role-based access control
- Real-time analytics and audit logging
- Group-based collaboration and form sharing

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| NLP | Natural Language Processing |
| ORM | Object-Relational Mapping |
| SPA | Single Page Application |
| CORS | Cross-Origin Resource Sharing |
| WebSocket | Full-duplex communication protocol |
| AI | Artificial Intelligence |
| SMTP | Simple Mail Transfer Protocol |

### 1.4 References
- Google Cloud Natural Language API Documentation
- Express.js Documentation
- React.js Documentation
- Sequelize ORM Documentation
- Socket.IO Documentation

### 1.5 Overview
This document is organized into eight main sections covering system architecture, data design, component design, interface design, security, and deployment strategies.

---

## 2. System Overview

### 2.1 System Description
Smart Form Validator is a three-tier web application consisting of:
- **Presentation Layer**: React-based single-page application
- **Application Layer**: Node.js/Express REST API with WebSocket support
- **Data Layer**: MySQL relational database with Google Cloud SQL

---

**[SCREENSHOT 1: Landing Page]**
> **Description:** Screenshot of the application's landing/home page showing:
> - Main navigation bar with logo and menu items
> - Hero section with application title and tagline
> - Feature highlights (Dynamic Forms, AI Validation, Real-time Analytics)
> - Call-to-action buttons (Get Started, Login, Sign Up)
> - Footer section

---

### 2.2 System Context

```
┌─────────────────────────────────────────────────────────────┐W
│                     External Systems                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Google Cloud    │  │   Google OAuth   │               │
│  │  NLP API         │  │   2.0 Provider   │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                          │
└───────────┼─────────────────────┼──────────────────────────┘
            │                     │
            │                     │
┌───────────▼─────────────────────▼──────────────────────────┐
│                  Smart Form Validator                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Frontend (React + Vite)                  │    │
│  │  - User Interface Components                       │    │
│  │  - Form Builder & Renderer                         │    │
│  │  - Real-time Updates (Socket.IO Client)            │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │ HTTPS/REST                          │
│                       │ WebSocket                           │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │        Backend (Node.js + Express)                 │    │
│  │  - REST API Endpoints                              │    │
│  │  - Authentication & Authorization                  │    │
│  │  - Business Logic                                  │    │
│  │  - AI Validation Service                           │    │
│  │  - WebSocket Server (Socket.IO)                    │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │ Sequelize ORM                       │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │      Database (MySQL - Google Cloud SQL)           │    │
│  │  - User & Account Data                             │    │
│  │  - Forms & Submissions                             │    │
│  │  - Groups & Permissions                            │    │
│  │  - Audit Logs                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Design Constraints
- **Technology Stack**: Node.js v18+, React 18+, MySQL 8.0+
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Cloud Platform**: Google Cloud Platform (GCP)
- **API Rate Limits**: Google NLP API quotas apply
- **Network**: Requires internet connectivity for AI features

### 2.4 Assumptions and Dependencies
- Google Cloud account with billing enabled
- Service account credentials for Google Cloud APIs
- SMTP server for email notifications (optional)
- MySQL database accessible via network

---

**[SCREENSHOT 2: Login Page]**
> **Description:** Screenshot of the login page showing:
> - Email input field
> - Password input field
> - "Remember Me" checkbox
> - Login button
> - "Sign in with Google" button (OAuth option)
> - "Forgot Password?" link
> - "Don't have an account? Sign up" link

---

**[SCREENSHOT 3: Registration Page]**
> **Description:** Screenshot of the registration/sign-up page showing:
> - Username input field
> - Email input field
> - Password input field
> - Confirm Password input field
> - Role selection (Admin/User)
> - "Create Account" button
> - "Sign up with Google" button
> - "Already have an account? Login" link

---

## 3. System Architecture

### 3.1 Architectural Style
The system follows a **three-tier client-server architecture** with:
- Clear separation of concerns
- RESTful API design
- Event-driven real-time communication
- Microservices-ready modular structure

### 3.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Presentation Tier                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            React SPA (Port 5173/5174)                  │  │
│  │                                                        │  │
│  │  Components:                                           │  │
│  │  ├─ Pages (AdminDashboard, FormFillPage, etc.)        │  │
│  │  ├─ Components (Modals, Buttons, Forms)               │  │
│  │  ├─ Context (AuthContext)                             │  │
│  │  ├─ Hooks (useWebSocket)                              │  │
│  │  └─ API Client (Axios)                                │  │
│  │                                                        │  │
│  │  State Management: React Context API                  │  │
│  │  Routing: React Router v6                             │  │
│  │  Build Tool: Vite                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTP/HTTPS (REST API)
                 │ WebSocket (Socket.IO)
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                     Application Tier                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Express.js Server (Port 5000)                  │  │
│  │                                                        │  │
│  │  Middleware:                                           │  │
│  │  ├─ Helmet (Security Headers)                         │  │
│  │  ├─ CORS (Cross-Origin)                               │  │
│  │  ├─ Rate Limiter                                      │  │
│  │  └─ JWT Authentication                                │  │
│  │                                                        │  │
│  │  Routes:                                               │  │
│  │  ├─ /api/auth (Authentication)                        │  │
│  │  ├─ /api/forms (Form Management)                      │  │
│  │  ├─ /api/submissions (Submission Handling)            │  │
│  │  ├─ /api/analytics (Analytics Data)                   │  │
│  │  ├─ /api/groups (Group Management)                    │  │
│  │  ├─ /api/accounts (Account Management)                │  │
│  │  └─ /api/audit (Audit Logs)                           │  │
│  │                                                        │  │
│  │  Controllers:                                          │  │
│  │  ├─ authController (Register, Login, OAuth)           │  │
│  │  ├─ formController (CRUD Forms)                       │  │
│  │  ├─ submissionController (Handle Submissions)         │  │
│  │  ├─ analyticsController (Generate Reports)            │  │
│  │  ├─ groupController (Manage Groups)                   │  │
│  │  └─ accountController (Multi-tenancy)                 │  │
│  │                                                        │  │
│  │  Services:                                             │  │
│  │  ├─ googleNlp.js (AI Validation)                      │  │
│  │  ├─ emailService.js (Notifications)                   │  │
│  │  └─ auditLogger.js (Audit Trail)                      │  │
│  │                                                        │  │
│  │  WebSocket Server (Socket.IO):                        │  │
│  │  ├─ Real-time submission updates                      │  │
│  │  ├─ Admin dashboard notifications                     │  │
│  │  └─ Form-specific event streams                       │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────┘
                 │ Sequelize ORM
                 │ MySQL Protocol
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                       Data Tier                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          MySQL Database (Google Cloud SQL)             │  │
│  │                                                        │  │
│  │  Tables:                                               │  │
│  │  ├─ users (Authentication & Profiles)                 │  │
│  │  ├─ forms (Form Definitions)                          │  │
│  │  ├─ form_fields (Field Configurations)                │  │
│  │  ├─ submissions (Submission Records)                  │  │
│  │  ├─ submission_data (Field Values)                    │  │
│  │  ├─ groups (Collaboration Groups)                     │  │
│  │  ├─ group_members (Group Membership)                  │  │
│  │  ├─ form_permissions (Access Control)                 │  │
│  │  ├─ password_resets (Reset Tokens)                    │  │
│  │  └─ audit_logs (Activity Tracking)                    │  │
│  │                                                        │  │
│  │  Indexes: Optimized for query performance             │  │
│  │  Character Set: utf8mb4 (Unicode support)             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Technology Stack

#### 3.3.1 Frontend Technologies
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 18.3.1 | UI Component Library |
| Build Tool | Vite | 5.4.10 | Fast build and dev server |
| Routing | React Router DOM | 6.28.0 | Client-side routing |
| HTTP Client | Axios | 1.7.7 | API communication |
| Real-time | Socket.IO Client | 4.8.1 | WebSocket connections |
| OAuth | @react-oauth/google | 0.12.1 | Google Sign-In |
| Language | JavaScript (ES6+) | - | Programming language |

#### 3.3.2 Backend Technologies
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express.js | 4.22.1 | Web application framework |
| ORM | Sequelize | 6.37.3 | Database abstraction |
| Database Driver | mysql2 | 3.11.0 | MySQL connector |
| Authentication | jsonwebtoken | 9.0.2 | JWT token generation |
| Password Hashing | bcryptjs | 2.4.3 | Secure password storage |
| Real-time | Socket.IO | 4.8.1 | WebSocket server |
| AI/NLP | @google-cloud/language | 6.0.3 | Google NLP API client |
| OAuth | google-auth-library | 9.0.0 | Google OAuth verification |
| Email | nodemailer | 6.9.15 | Email sending |
| Security | Helmet | 7.0.0 | HTTP security headers |
| Rate Limiting | express-rate-limit | 7.4.1 | API rate limiting |
| CORS | cors | 2.8.5 | Cross-origin support |
| Validation | express-validator | 7.2.1 | Input validation |

#### 3.3.3 Database
- **Database Management System**: MySQL 8.0+
- **Cloud Service**: Google Cloud SQL for MySQL
- **Character Set**: utf8mb4 (full Unicode support)
- **Storage Engine**: InnoDB (ACID compliance, transactions)

---

**[SCREENSHOT 4: Admin Dashboard Overview]**
> **Description:** Screenshot of the admin dashboard page showing:
> - Left sidebar navigation menu (Dashboard, Forms, Submissions, Analytics, Groups, Users, Audit)
> - Top header with user profile and logout button
> - Main content area with statistics cards:
>   - Total Forms count
>   - Total Submissions count
>   - Submissions This Month count
>   - AI Flags count
> - Recent Activity feed showing latest actions
> - Quick action buttons (Create Form, View Submissions)

---

### 3.4 Communication Protocols

#### 3.4.1 REST API
- **Protocol**: HTTP/HTTPS
- **Data Format**: JSON
- **Authentication**: Bearer Token (JWT)
- **Base URL**: `http://localhost:5000/api` (development)

#### 3.4.2 WebSocket
- **Library**: Socket.IO
- **Protocol**: WebSocket with HTTP long-polling fallback
- **Events**:
  - `join-admin-room`: Subscribe to admin updates
  - `join-form-room`: Subscribe to form-specific updates
  - `new-submission`: Broadcast new submissions
  - `submission-update`: Broadcast submission changes

### 3.5 Module Dependencies

```
Backend Module Structure:
├── server.js (Entry point)
├── sequelize.js (Database connection)
├── models/ (Data models)
│   ├── User.js
│   ├── Form.js
│   ├── FormField.js
│   ├── Submission.js
│   ├── SubmissionData.js
│   ├── Group.js
│   ├── GroupMember.js
│   ├── FormPermission.js
│   ├── PasswordReset.js
│   └── AuditLog.js
├── controllers/ (Business logic)
│   ├── authController.js
│   ├── formController.js
│   ├── submissionController.js
│   ├── analyticsController.js
│   ├── groupController.js
│   └── accountController.js
├── routes/ (API endpoints)
│   ├── auth.js
│   ├── forms.js
│   ├── submissions.js
│   ├── analytics.js
│   ├── groups.js
│   ├── accounts.js
│   └── audit.js
├── middleware/ (Request processing)
│   ├── auth.js (JWT verification)
│   └── rateLimiter.js (Rate limiting)
└── services/ (External integrations)
    ├── googleNlp.js (AI validation)
    ├── emailService.js (Email sending)
    └── auditLogger.js (Activity logging)
```

---

**[SCREENSHOT 5: Forms List Page]**
> **Description:** Screenshot of the forms management/list page showing:
> - Page title "My Forms" or "All Forms"
> - "Create New Form" button
> - Search/filter options
> - Table or card layout displaying multiple forms with:
>   - Form title
>   - Created date
>   - Number of fields
>   - Number of submissions
>   - Action buttons (View, Edit, Delete, Share)
> - Pagination controls if applicable

---

## 4. Data Design

### 4.1 Conceptual Data Model

The system uses a relational data model with the following key entities:
- **Users**: System users with roles (admin/user)
- **Accounts**: Multi-tenant account structures
- **Forms**: Dynamic form definitions
- **Form Fields**: Field configurations with validation rules
- **Submissions**: Form submission instances
- **Submission Data**: Individual field values with AI flags
- **Groups**: Collaboration groups for form sharing
- **Group Members**: User memberships in groups
- **Form Permissions**: Fine-grained access control
- **Password Resets**: Token-based password recovery
- **Audit Logs**: System activity tracking

### 4.2 Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ PK  id             │
│     username        │
│ UK  email          │
│     password        │
│     role           │
│ FK  account_id     │◄─────┐ Self-referential
│     is_account_owner│      │ (Multi-tenancy)
│     created_at      │      │
└──────┬──────────────┘      │
       │                     │
       │ 1                   │
       │                     │
       │ *                   │
       │                     │
┌──────▼──────────────┐      │
│       forms         │      │
├─────────────────────┤      │
│ PK  id             │      │
│     title          │      │
│ FK  created_by     │──────┘
│ FK  account_id     │
│     created_at      │
└──────┬──────────────┘
       │
       │ 1
       │
       │ *
       │
┌──────▼──────────────────────┐
│       form_fields           │
├─────────────────────────────┤
│ PK  id                     │
│ FK  form_id                │
│     label                  │
│     type                   │
│     is_required            │
│     ai_validation_enabled  │
│     expected_entity        │
│     expected_sentiment     │
│     options                │
└─────────────────────────────┘

┌─────────────────────┐
│    submissions      │
├─────────────────────┤
│ PK  id             │
│ FK  form_id        │
│ FK  submitted_by   │
│     submitted_at    │
└──────┬──────────────┘
       │
       │ 1
       │
       │ *
       │
┌──────▼─────────────────────┐
│    submission_data         │
├────────────────────────────┤
│ PK  id                    │
│ FK  submission_id         │
│ FK  field_id              │
│     value                 │
│     ai_sentiment_flag     │
│     ai_entity_flag        │
│     ai_not_evaluated      │
│     ai_errors             │
└────────────────────────────┘

┌─────────────────────┐
│       groups        │
├─────────────────────┤
│ PK  id             │
│     name           │
│     description     │
│ FK  created_by     │
│ FK  account_id     │
│     created_at      │
└──────┬──────────────┘
       │
       │ 1
       │
       │ *
       │
┌──────▼──────────────┐
│   group_members     │
├─────────────────────┤
│ PK  id             │
│ FK  group_id       │
│ FK  user_id        │
│     role           │
│     joined_at      │
└─────────────────────┘

┌─────────────────────┐
│  form_permissions   │
├─────────────────────┤
│ PK  id             │
│ FK  form_id        │
│ FK  group_id       │
│     permission_type │
│     granted_at      │
└─────────────────────┘

┌─────────────────────┐
│  password_resets    │
├─────────────────────┤
│ PK  id             │
│ FK  user_id        │
│     token          │
│     expires_at      │
│     created_at      │
│     used           │
└─────────────────────┘

┌─────────────────────┐
│    audit_logs       │
├─────────────────────┤
│ PK  id             │
│ FK  user_id        │
│     action         │
│     entity_type     │
│     entity_id       │
│     details         │
│     ip_address      │
│     created_at      │
└─────────────────────┘
```

---

**[SCREENSHOT 6: Form Builder/Create Form Page]**
> **Description:** Screenshot of the form creation/builder page showing:
> - Form title input field at the top
> - "Add Field" button
> - List of added form fields (at least 2-3 examples) with:
>   - Field label
>   - Field type (dropdown: text, email, textarea, number, etc.)
>   - "Required" checkbox
>   - "Enable AI Validation" checkbox
>   - For AI-enabled fields:
>     - Expected Entity dropdown (PERSON, LOCATION, ORGANIZATION, etc.)
>     - Expected Sentiment dropdown (positive, negative, neutral, any)
>   - Edit and Delete buttons for each field
> - "Preview Form" button
> - "Save Form" button
> - "Cancel" button

---

### 4.3 Data Dictionary

#### 4.3.1 Table: users
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(255) | NOT NULL | User's display name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM('admin','user') | NOT NULL | User role for RBAC |
| account_id | INT | FOREIGN KEY, NULL | Reference to parent account |
| is_account_owner | BOOLEAN | DEFAULT FALSE | Account ownership flag |
| created_at | DATETIME | DEFAULT NOW | Registration timestamp |

**Indexes:**
- PRIMARY: id
- UNIQUE: email
- INDEX: role, account_id

#### 4.3.2 Table: forms
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique form identifier |
| title | VARCHAR(255) | NOT NULL | Form title |
| created_by | INT | FOREIGN KEY, NOT NULL | Creator user ID |
| account_id | INT | FOREIGN KEY, NULL | Account owner ID |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |

**Indexes:**
- PRIMARY: id
- INDEX: created_by, account_id, created_at

**Foreign Keys:**
- created_by → users(id) ON DELETE CASCADE
- account_id → users(id) ON DELETE SET NULL

#### 4.3.3 Table: form_fields
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique field identifier |
| form_id | INT | FOREIGN KEY, NOT NULL | Parent form ID |
| label | VARCHAR(255) | NOT NULL | Field label text |
| type | ENUM | NOT NULL | Field type (text, email, number, etc.) |
| is_required | BOOLEAN | DEFAULT FALSE | Required field flag |
| ai_validation_enabled | BOOLEAN | DEFAULT FALSE | Enable AI validation |
| expected_entity | VARCHAR(50) | DEFAULT 'none' | Expected NLP entity type |
| expected_sentiment | VARCHAR(50) | DEFAULT 'any' | Expected sentiment |
| options | TEXT | NULL | JSON options for select/checkbox |

**Enum Values for type:**
- text, email, number, textarea, phone, date, select, checkbox, file

**Indexes:**
- PRIMARY: id
- INDEX: form_id, type

**Foreign Keys:**
- form_id → forms(id) ON DELETE CASCADE

#### 4.3.4 Table: submissions
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique submission identifier |
| form_id | INT | FOREIGN KEY, NOT NULL | Form being submitted |
| submitted_by | INT | FOREIGN KEY, NULL | Submitter user ID |
| submitted_at | DATETIME | DEFAULT NOW | Submission timestamp |

**Indexes:**
- PRIMARY: id
- INDEX: form_id, submitted_by, submitted_at

**Foreign Keys:**
- form_id → forms(id) ON DELETE CASCADE
- submitted_by → users(id) ON DELETE SET NULL

#### 4.3.5 Table: submission_data
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique data identifier |
| submission_id | INT | FOREIGN KEY, NOT NULL | Parent submission ID |
| field_id | INT | FOREIGN KEY, NOT NULL | Form field ID |
| value | TEXT | NOT NULL | User input value |
| ai_sentiment_flag | BOOLEAN | DEFAULT FALSE | Sentiment mismatch detected |
| ai_entity_flag | BOOLEAN | DEFAULT FALSE | Entity mismatch detected |
| ai_not_evaluated | BOOLEAN | DEFAULT FALSE | AI check skipped/failed |
| ai_errors | TEXT | NULL | JSON array of AI error details |

**Indexes:**
- PRIMARY: id
- INDEX: submission_id, field_id
- INDEX: ai_sentiment_flag, ai_entity_flag

**Foreign Keys:**
- submission_id → submissions(id) ON DELETE CASCADE
- field_id → form_fields(id) ON DELETE CASCADE

#### 4.3.6 Table: groups
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique group identifier |
| name | VARCHAR(255) | NOT NULL | Group name |
| description | TEXT | NULL | Group description |
| created_by | INT | FOREIGN KEY, NOT NULL | Creator user ID |
| account_id | INT | FOREIGN KEY, NULL | Account owner ID |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |

**Foreign Keys:**
- created_by → users(id) ON DELETE CASCADE
- account_id → users(id) ON DELETE SET NULL

#### 4.3.7 Table: group_members
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique membership identifier |
| group_id | INT | FOREIGN KEY, NOT NULL | Group ID |
| user_id | INT | FOREIGN KEY, NOT NULL | User ID |
| role | ENUM('owner','admin','member') | DEFAULT 'member' | Member role |
| joined_at | DATETIME | DEFAULT NOW | Join timestamp |

**Foreign Keys:**
- group_id → groups(id) ON DELETE CASCADE
- user_id → users(id) ON DELETE CASCADE

#### 4.3.8 Table: form_permissions
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique permission identifier |
| form_id | INT | FOREIGN KEY, NOT NULL | Form ID |
| group_id | INT | FOREIGN KEY, NOT NULL | Group ID |
| permission_type | ENUM('view','edit','submit') | NOT NULL | Permission level |
| granted_at | DATETIME | DEFAULT NOW | Grant timestamp |

**Foreign Keys:**
- form_id → forms(id) ON DELETE CASCADE
- group_id → groups(id) ON DELETE CASCADE

#### 4.3.9 Table: password_resets
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique reset identifier |
| user_id | INT | FOREIGN KEY, NOT NULL | User ID |
| token | VARCHAR(255) | NOT NULL, UNIQUE | Reset token |
| expires_at | DATETIME | NOT NULL | Expiration timestamp |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |
| used | BOOLEAN | DEFAULT FALSE | Token usage flag |

**Foreign Keys:**
- user_id → users(id) ON DELETE CASCADE

#### 4.3.10 Table: audit_logs
| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique log identifier |
| user_id | INT | FOREIGN KEY, NULL | User performing action |
| action | VARCHAR(255) | NOT NULL | Action description |
| entity_type | VARCHAR(100) | NULL | Affected entity type |
| entity_id | INT | NULL | Affected entity ID |
| details | TEXT | NULL | Additional JSON details |
| ip_address | VARCHAR(45) | NULL | Client IP address |
| created_at | DATETIME | DEFAULT NOW | Log timestamp |

**Foreign Keys:**
- user_id → users(id) ON DELETE SET NULL

### 4.4 Data Access Patterns

#### 4.4.1 User Authentication Flow
```sql
-- Login: Verify credentials
SELECT id, username, email, role, account_id, is_account_owner, password
FROM users
WHERE email = ? LIMIT 1;

-- After successful login, log audit event
INSERT INTO audit_logs (user_id, action, ip_address, created_at)
VALUES (?, 'USER_LOGIN', ?, NOW());
```

#### 4.4.2 Form Creation Flow
```sql
-- Create form
INSERT INTO forms (title, created_by, account_id, created_at)
VALUES (?, ?, ?, NOW());

-- Add form fields
INSERT INTO form_fields (form_id, label, type, is_required, 
  ai_validation_enabled, expected_entity, expected_sentiment)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Log audit event
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES (?, 'FORM_CREATED', 'form', ?, ?);
```

#### 4.4.3 Form Submission with AI Validation
```sql
-- Create submission record
INSERT INTO submissions (form_id, submitted_by, submitted_at)
VALUES (?, ?, NOW());

-- Store field data with AI flags
INSERT INTO submission_data (submission_id, field_id, value, 
  ai_sentiment_flag, ai_entity_flag, ai_not_evaluated, ai_errors)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Log submission event
INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
VALUES (?, 'FORM_SUBMITTED', 'submission', ?);
```

#### 4.4.4 Analytics Query
```sql
-- Get submission statistics with AI flags
SELECT 
  f.id, f.title, f.created_at,
  COUNT(DISTINCT s.id) as total_submissions,
  COUNT(DISTINCT CASE WHEN sd.ai_sentiment_flag = 1 OR sd.ai_entity_flag = 1 
    THEN s.id END) as flagged_submissions,
  AVG(CASE WHEN sd.ai_sentiment_flag = 1 OR sd.ai_entity_flag = 1 
    THEN 1 ELSE 0 END) as flag_rate
FROM forms f
LEFT JOIN submissions s ON f.id = s.form_id
LEFT JOIN submission_data sd ON s.id = sd.submission_id
WHERE f.account_id = ? OR f.created_by = ?
GROUP BY f.id
ORDER BY f.created_at DESC;
```

### 4.5 Data Integrity Constraints

#### 4.5.1 Referential Integrity
- Cascade deletions for dependent records (forms delete form_fields)
- Set NULL for optional references (deleted user's submissions remain)
- Prevent orphaned records through foreign key constraints

#### 4.5.2 Business Rules
- Email addresses must be unique across all users
- Account owners must have is_account_owner = true
- Group members cannot join the same group twice (unique constraint)
- Password reset tokens expire after configured time period
- AI validation only occurs when ai_validation_enabled = true

#### 4.5.3 Data Validation
- Email format validation at application layer
- Password strength requirements (minimum length, complexity)
- Form field types restrict acceptable values
- Expected entity and sentiment values validated against allowed list
- JSON options validated for select/checkbox fields

