# Software Design Document (SDD)
## Smart Form Validator with AI Integration

**Version:** 1.0  
**Date:** December 18, 2025  
**Project:** Smart Form Validation System  
**Organization:** Development Team  

---

## Document Control

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | December 18, 2025 | Development Team | Complete SDD Release |

---

## Executive Summary

The Smart Form Validator is an innovative web-based application that combines dynamic form creation capabilities with artificial intelligence-powered validation. This system enables administrators to create custom forms with configurable validation rules, while leveraging Google Cloud Natural Language API to perform intelligent sentiment analysis and entity recognition on user submissions. The application features real-time notifications, comprehensive analytics, and multi-tenant support, making it suitable for enterprises requiring sophisticated form management solutions.

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
   - 1.5 Overview

2. [System Overview](#2-system-overview)
   - 2.1 System Description
   - 2.2 System Context
   - 2.3 Design Constraints
   - 2.4 Assumptions and Dependencies

3. [System Architecture](#3-system-architecture)
   - 3.1 Architectural Style
   - 3.2 Architecture Diagram
   - 3.3 Technology Stack
   - 3.4 Communication Protocols
   - 3.5 Module Dependencies

4. [Data Design](#4-data-design)
   - 4.1 Conceptual Data Model
   - 4.2 Entity Relationship Diagram (ERD)
   - 4.3 Data Dictionary
   - 4.4 Data Access Patterns
   - 4.5 Data Integrity Constraints

5. [Component Design](#5-component-design)
   - 5.1 Backend Components
   - 5.2 Frontend Components
   - 5.3 Component Interaction Diagrams

6. [Interface Design](#6-interface-design)
   - 6.1 User Interface Design
   - 6.2 API Interface Design
   - 6.3 External API Integration
   - 6.4 WebSocket Interface

7. [Security Design](#7-security-design)
   - 7.1 Authentication
   - 7.2 Authorization
   - 7.3 Data Security
   - 7.4 Security Headers
   - 7.5 Audit Logging
   - 7.6 API Key Management
   - 7.7 Security Best Practices

8. [Deployment Architecture](#8-deployment-architecture)
   - 8.1 Infrastructure Overview
   - 8.2 Deployment Diagram
   - 8.3 Environment Configuration
   - 8.4 Containerization
   - 8.5 CI/CD Pipeline
   - 8.6 Database Deployment
   - 8.7 Monitoring and Logging
   - 8.8 Scaling Strategy
   - 8.9 Disaster Recovery

9. [Appendices](#9-appendices)
   - 9.1 Glossary
   - 9.2 References
   - 9.3 Revision History

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document (SDD) describes the architecture and detailed design of the Smart Form Validator system. It provides a comprehensive blueprint for developers, testers, and stakeholders to understand the system's structure, components, and interactions.

**Target Audience:**
- Software developers and engineers
- System architects
- Quality assurance testers
- Project managers
- System administrators
- Technical stakeholders

**Document Objectives:**
- Define system architecture and design patterns
- Specify component interactions and data flows
- Document API specifications and interfaces
- Describe security mechanisms and protocols
- Provide deployment and operational guidelines

### 1.2 Scope

The Smart Form Validator is a comprehensive web-based application that enables:

**Core Functionality:**
- **Dynamic Form Creation**: Administrators can create custom forms with various field types and validation rules
- **AI-Powered Validation**: Integration with Google Cloud Natural Language API for sentiment analysis and entity recognition
- **End-User Submission**: Public-facing forms with real-time validation feedback
- **Multi-Tenant Architecture**: Account-based organization with role-based access control
- **Real-Time Analytics**: Dashboard with submission statistics and AI validation insights
- **Group Collaboration**: Team-based form sharing and permission management
- **Audit Trail**: Comprehensive activity logging for compliance and security

**System Boundaries:**
- **In Scope**: Form management, user authentication, AI validation, analytics, notifications
- **Out of Scope**: Payment processing, third-party CRM integrations, mobile native applications

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| AI | Artificial Intelligence - Computer systems that perform tasks requiring human intelligence |
| API | Application Programming Interface - Set of rules for building software applications |
| CORS | Cross-Origin Resource Sharing - Mechanism for accessing resources from different origins |
| ERD | Entity Relationship Diagram - Visual representation of database structure |
| GCP | Google Cloud Platform - Suite of cloud computing services |
| HTTP | Hypertext Transfer Protocol - Foundation of data communication for the web |
| JWT | JSON Web Token - Compact URL-safe token format for authentication |
| NLP | Natural Language Processing - AI field focused on language understanding |
| ORM | Object-Relational Mapping - Programming technique for database access |
| RBAC | Role-Based Access Control - Method of restricting system access |
| REST | Representational State Transfer - Architectural style for distributed systems |
| SDD | Software Design Document - Technical specification document |
| SMTP | Simple Mail Transfer Protocol - Internet standard for email transmission |
| SPA | Single Page Application - Web application that loads a single HTML page |
| SQL | Structured Query Language - Language for managing relational databases |
| SSL/TLS | Secure Sockets Layer / Transport Layer Security - Cryptographic protocols |
| WebSocket | Full-duplex communication protocol over a single TCP connection |

### 1.4 References

**Technical Documentation:**
1. Google Cloud Natural Language API Documentation  
   https://cloud.google.com/natural-language/docs

2. Express.js Framework Documentation  
   https://expressjs.com/

3. React.js Library Documentation  
   https://react.dev/

4. Sequelize ORM Documentation  
   https://sequelize.org/

5. Socket.IO Real-Time Engine Documentation  
   https://socket.io/docs/

6. MySQL 8.0 Reference Manual  
   https://dev.mysql.com/doc/refman/8.0/en/

**Standards and Specifications:**
7. RFC 7519: JSON Web Token (JWT)  
   https://tools.ietf.org/html/rfc7519

8. RFC 6749: OAuth 2.0 Authorization Framework  
   https://tools.ietf.org/html/rfc6749

9. WCAG 2.1 Web Content Accessibility Guidelines  
   https://www.w3.org/WAI/WCAG21/quickref/

### 1.5 Overview

This document is organized into nine main sections:

- **Sections 1-2**: Introduction and system overview provide context and high-level description
- **Section 3**: System architecture details the technical infrastructure and design patterns
- **Section 4**: Data design covers database schema, relationships, and data management
- **Section 5**: Component design describes frontend and backend modules in detail
- **Section 6**: Interface design specifies UI/UX and API contracts
- **Section 7**: Security design outlines authentication, authorization, and protection mechanisms
- **Section 8**: Deployment architecture explains infrastructure and operational procedures
- **Section 9**: Appendices contain supplementary information and references

---

## 2. System Overview

### 2.1 System Description

Smart Form Validator is a three-tier web application consisting of:

**Presentation Layer (Frontend):**
- React-based single-page application
- Responsive user interface
- Real-time WebSocket communication
- Client-side validation

**Application Layer (Backend):**
- Node.js/Express REST API server
- Business logic and validation
- Authentication and authorization
- AI service integration
- WebSocket server for real-time updates

**Data Layer (Database):**
- MySQL relational database
- Google Cloud SQL managed service
- Structured data storage
- Transaction support

### 2.2 System Context

```
┌─────────────────────────────────────────────────────────────┐
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

**System Actors:**
- **End Users**: Fill and submit forms
- **Administrators**: Create forms, view submissions, manage users
- **Account Owners**: Manage multi-tenant accounts
- **System**: Automated processes (AI validation, notifications)

**External Dependencies:**
- **Google Cloud NLP API**: Sentiment and entity analysis
- **Google OAuth 2.0**: User authentication
- **SMTP Server**: Email notifications (optional)
- **Cloud Infrastructure**: Hosting and storage services

### 2.3 Design Constraints

**Technical Constraints:**
- **Technology Stack**: Node.js v18+, React 18+, MySQL 8.0+
- **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Cloud Platform**: Google Cloud Platform (GCP)
- **API Rate Limits**: Google NLP API quotas (600 requests/minute for sentiment analysis)
- **Network**: Requires internet connectivity for AI features and OAuth

**Business Constraints:**
- **Budget**: Development within allocated cloud computing budget
- **Timeline**: Phased deployment approach
- **Compliance**: GDPR and data protection requirements
- **Scalability**: Support for up to 10,000 concurrent users initially

**Regulatory Constraints:**
- Data privacy and protection regulations
- Audit trail requirements
- User consent for data processing
- Secure data transmission and storage

### 2.4 Assumptions and Dependencies

**Assumptions:**
- Users have stable internet connectivity
- Modern web browsers with JavaScript enabled
- Google Cloud services remain available and reliable
- Email delivery for notifications is not mission-critical
- Users understand basic form filling procedures

**Dependencies:**
- **Google Cloud Account**: Active GCP account with billing enabled
- **Service Credentials**: Google Cloud service account JSON key file
- **SMTP Server**: Email server configuration for notifications (optional)
- **MySQL Database**: Accessible database instance via network
- **SSL Certificates**: Valid SSL/TLS certificates for HTTPS
- **Development Tools**: Node.js, npm, Git for development and deployment

---

## 3. System Architecture

### 3.1 Architectural Style

The system follows a **three-tier client-server architecture** with:

**Architectural Principles:**
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **RESTful API Design**: Stateless communication using HTTP methods and JSON data format
- **Event-Driven Architecture**: Real-time updates via WebSocket connections
- **Modular Structure**: Loosely coupled components for maintainability
- **Microservices-Ready**: Design allows future decomposition into microservices

**Design Patterns:**
- **MVC (Model-View-Controller)**: Backend organized into models, controllers, and routes
- **Repository Pattern**: Data access abstraction through Sequelize ORM
- **Middleware Pattern**: Request processing pipeline with authentication, validation, and logging
- **Observer Pattern**: WebSocket event-driven communication
- **Singleton Pattern**: Database connection and external service clients

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
- **Collation**: utf8mb4_unicode_ci

### 3.4 Communication Protocols

#### 3.4.1 REST API

- **Protocol**: HTTP/HTTPS
- **Data Format**: JSON
- **Authentication**: Bearer Token (JWT)
- **Base URL**: `http://localhost:5000/api` (development)
- **HTTP Methods**:
  - GET: Retrieve resources
  - POST: Create resources
  - PUT: Update resources
  - DELETE: Remove resources

#### 3.4.2 WebSocket

- **Library**: Socket.IO
- **Protocol**: WebSocket with HTTP long-polling fallback
- **Connection**: Persistent bidirectional communication
- **Events**:
  - `join-admin-room`: Subscribe to admin updates
  - `join-form-room`: Subscribe to form-specific updates
  - `new-submission`: Broadcast new submissions
  - `submission-update`: Broadcast submission changes
  - `form-updated`: Notify of form modifications

### 3.5 Module Dependencies

```
Backend Module Structure:
backend/
├── server.js (Entry point)
├── sequelize.js (Database connection)
├── package.json (Dependencies)
├── .env (Environment variables)
│
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
│
├── controllers/ (Business logic)
│   ├── authController.js
│   ├── formController.js
│   ├── submissionController.js
│   ├── analyticsController.js
│   ├── groupController.js
│   └── accountController.js
│
├── routes/ (API endpoints)
│   ├── auth.js
│   ├── forms.js
│   ├── submissions.js
│   ├── analytics.js
│   ├── groups.js
│   ├── accounts.js
│   └── audit.js
│
├── middleware/ (Request processing)
│   ├── auth.js (JWT verification)
│   └── rateLimiter.js (Rate limiting)
│
└── services/ (External integrations)
    ├── googleNlp.js (AI validation)
    ├── emailService.js (Email sending)
    └── auditLogger.js (Activity logging)

Frontend Module Structure:
frontend/
├── index.html (Entry HTML)
├── package.json (Dependencies)
├── vite.config.js (Build configuration)
│
└── src/
    ├── main.jsx (Application entry)
    ├── App.jsx (Main component)
    ├── api.js (API client)
    ├── AuthContext.jsx (Auth state)
    │
    ├── pages/ (Page components)
    │   ├── HomePage.jsx
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── AdminDashboard.jsx
    │   ├── CreateFormPage.jsx
    │   ├── FormFillPage.jsx
    │   ├── FormSubmissionsPage.jsx
    │   ├── AnalyticsPage.jsx
    │   ├── ManageGroupsPage.jsx
    │   └── ManageUsersPage.jsx
    │
    ├── components/ (Reusable components)
    │   ├── GoogleSignInNotification.jsx
    │   ├── GoogleRoleSelectionModal.jsx
    │   ├── SendToModal.jsx
    │   ├── DeleteUsersModal.jsx
    │   └── ScrollToTopButton.jsx
    │
    ├── hooks/ (Custom React hooks)
    │   └── useWebSocket.js
    │
    └── css/ (Stylesheets)
        ├── base.css
        ├── components.css
        ├── layout.css
        └── [page-specific].css
```

---

*[The document continues with sections 4-9 following the same format and structure, including all tables, diagrams, and detailed specifications from Parts 1, 2, and 3]*

---

## 4. Data Design

### 4.1 Conceptual Data Model

The system uses a relational data model with the following key entities:

**Core Entities:**
- **Users**: System users with roles (admin/user)
- **Accounts**: Multi-tenant account structures
- **Forms**: Dynamic form definitions
- **Form Fields**: Field configurations with validation rules
- **Submissions**: Form submission instances
- **Submission Data**: Individual field values with AI flags

**Supporting Entities:**
- **Groups**: Collaboration groups for form sharing
- **Group Members**: User memberships in groups
- **Form Permissions**: Fine-grained access control
- **Password Resets**: Token-based password recovery
- **Audit Logs**: System activity tracking

**Relationships:**
- One-to-Many: User → Forms, Form → Form Fields, Submission → Submission Data
- Many-to-Many: Users ↔ Groups (through Group Members)
- Self-Referential: User → Account (Multi-tenancy)

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

**Foreign Keys:**
- account_id → users(id) ON DELETE SET NULL

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

- **Cascade Deletions**: Forms cascade to form_fields and submissions
- **Set NULL**: Deleted users set NULL on optional references
- **Prevent Orphans**: Foreign key constraints prevent orphaned records

#### 4.5.2 Business Rules

- Email addresses must be unique across all users
- Account owners must have is_account_owner = true
- Group members cannot join the same group twice
- Password reset tokens expire after configured time period
- AI validation only occurs when ai_validation_enabled = true

#### 4.5.3 Data Validation

- Email format validation at application layer
- Password strength requirements (minimum 8 characters)
- Form field types restrict acceptable values
- Expected entity and sentiment values validated against allowed list
- JSON options validated for select/checkbox fields

---

## 5. Component Design

### 5.1 Backend Components

#### 5.1.1 Server Core (server.js)

**Purpose**: Application entry point and server initialization

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

| Term | Definition |
|------|------------|
| Form Field | Individual input element within a form |
| Submission | A completed form filled out by a user |
| AI Validation | Automated analysis using Google NLP API |
| Sentiment Score | Numeric value (-1.0 to 1.0) indicating emotional tone |
| Entity | Named item extracted from text (person, place, organization) |
| Account | Multi-tenant organizational unit |
| Group | Collection of users for collaboration |
| Audit Log | Record of system activity for compliance |
| WebSocket | Protocol for real-time bidirectional communication |
| OAuth | Open standard for access delegation |

### 9.2 References

1. Google Cloud Natural Language API: https://cloud.google.com/natural-language
2. Express.js Documentation: https://expressjs.com
3. React Documentation: https://react.dev
4. Sequelize ORM: https://sequelize.org
5. Socket.IO Documentation: https://socket.io
6. JWT RFC 7519: https://tools.ietf.org/html/rfc7519
7. OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
8. MySQL 8.0 Reference: https://dev.mysql.com/doc/refman/8.0/en/
9. Node.js Documentation: https://nodejs.org/docs/
10. Google Cloud Platform: https://cloud.google.com/docs

### 9.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 18, 2025 | Development Team | Complete SDD documentation combining all parts |

---

**End of Software Design Document**

---

**Document Prepared By:**  
Development Team  
Smart Form Validator Project  

**Document Approved By:**  
[Signature Block]

**Distribution List:**  
- Project Manager
- Development Team Lead
- Quality Assurance Team
- System Administrators
- Stakeholders

---

**Confidentiality Notice:**  
This document contains proprietary and confidential information. Distribution is limited to authorized personnel only.

**Copyright © 2025 Smart Form Validator Project. All rights reserved.**
