# Smart Form Validator with AI Integration (Google Cloud Natural Language API)

Smart Form Validator is a web-based system that validates online form inputs using **basic rules** (required, email, numeric) and **AI-powered context checks** via **Google Cloud Natural Language API**. It is based on your Software Requirements Specification (SRS) for:

- Dynamic form creation (Administrator)
- End-user form filling and submission
- AI validation for sentiment and entity correctness
- Secure storage and admin review of submissions

This repository contains a **Node.js/Express + Sequelize** backend and a **React + Vite** frontend.

---

## Project Structure

- `backend/`
  - `src/server.js` – Express server entry point
  - `src/sequelize.js` – Sequelize database connection (MySQL)
  - `src/routes/` – API routes:
    - `auth.js` – register/login (JWT)
    - `forms.js` – create & list forms
    - `submissions.js` – submit forms + view submissions (admin)
  - `src/models/` – Sequelize models based on the ERD:
    - `User`, `Form`, `FormField`, `Submission`, `SubmissionData`
  - `src/services/googleNlp.js` – wrapper for Google Cloud Natural Language API
  - `src/middleware/auth.js` – JWT auth + role checking (RBAC)
  - **(For documentation submissions)** you may reference this backend as:
    `smartformvalidation\backend\src\main\java\com\smartformvalidation`
    even though the implementation is **Node.js/Express (JavaScript)** rather than Java.
- `frontend/`
  - `src/App.jsx` – main SPA routes & navigation
  - `src/AuthContext.jsx` – frontend auth state (login/logout/register)
  - `src/api.js` – Axios instance that attaches JWT automatically
  - `src/pages/`
    - `AdminDashboard.jsx` – Administrator form builder + link to submissions
    - `FormFillPage.jsx` – End-user form filling and unified validation feedback
    - `FormSubmissionsPage.jsx` – Admin view of submissions with AI flags
    - `LoginPage.jsx`, `RegisterPage.jsx` – authentication UI
  - `src/styles.css` – basic UI styling

---

## Prerequisites

- **Node.js**: v18+ (both backend and frontend)
- **Database**: MySQL 8.x (or compatible)
- **Google Cloud**:
  - A GCP project with **Cloud Natural Language API** enabled
  - A service account JSON key file

---

## Backend Setup (`backend/`)

1. **Install dependencies**

```bash
cd backend
npm install
```

2. **Configure environment variables**

Create `.env` in `backend/`:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_form_validator
DB_USER=root
DB_PASS=your_password_here

JWT_SECRET=your_jwt_secret_here

# Google Cloud NLP
GCLOUD_NLP_ENABLED=true
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/your/service-account.json
```

Adjust DB values and the path to your service account JSON file as needed.  
If you set `GCLOUD_NLP_ENABLED=false`, the API wrapper becomes a no-op and only basic validation is used.

3. **Create the database**

```sql
CREATE DATABASE smart_form_validator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Run the backend**

```bash
cd backend
npm run dev
```

The API will start on `http://localhost:4000` and automatically **sync tables** via Sequelize.

---

## Backend Dependencies (Node.js + Express)

The backend uses the following key libraries (all declared in `backend/package.json`):

- **express** – backend web framework (routing, middleware, HTTP handling)
- **cors** – enables secure frontend/backend communication across origins
- **dotenv** – loads environment variables from `.env` files
- **mysql2** – MySQL driver used by Sequelize
- **sequelize** – ORM for MySQL, mapping to the ERD (`users`, `forms`, `form_fields`, `submissions`, `submission_data`)
- **jsonwebtoken** – creates and verifies JWT login tokens
- **bcryptjs** – password hashing for secure storage of user passwords
- **@google-cloud/language** – official Google Cloud Natural Language API client
- **helmet** – sets secure HTTP headers
- **express-validator** – request body validation for API endpoints

Dev dependency:

- **nodemon** – automatically restarts the Node server during development when files change

If you install from `backend/package.json` (`npm install`), all of these are pulled in automatically.

---

## Frontend Setup (`frontend/`)

1. **Install dependencies**

```bash
cd frontend
npm install
```

2. **Start the dev server**

```bash
npm run dev
```

The app runs on `http://localhost:5173`. Vite is already configured to **proxy `/api`** requests to `http://localhost:4000`.

---

## Basic Usage Flow

1. **Register an Administrator**
   - Open `http://localhost:5173/register`
   - Enter email, password, and keep role as **Administrator**
   - Submit – your admin account is created via `POST /api/auth/register`

2. **Login**
   - Go to `http://localhost:5173/login`
   - Login with the administrator credentials
   - A JWT is stored in `localStorage` and sent on all `/api` calls

3. **Create a Form (Admin)**
   - Navigate to **Admin** (`/admin`)
   - Set a **Form Title**
   - Add fields (label, type: text/email/number/textarea)
   - Check **Required** and/or **AI Validation** where needed
   - Click **Save Form**
   - On success, a form record plus `form_fields` are stored in the DB

4. **Fill the Form (End-User)**
   - Go to `/forms/{formId}` (or use the Sample Form link if you know its ID)
   - Enter values and submit
   - The backend performs:
     - Basic validation (required, email format, numeric)
     - If enabled, AI validation:
       - Sentiment analysis (flags strongly negative inputs)
       - Entity analysis (checks for missing entities on name/company-like fields)
   - Errors are returned in a unified list; the UI highlights each field and shows human-readable AI explanations.

5. **View Submissions (Admin)**
   - From `/admin`, enter the form ID in **View Submissions** and click **Open Submissions**
   - Route: `/admin/forms/{id}/submissions`
   - Shows each submission and answers; any answer with `ai_sentiment_flag` or `ai_entity_flag` is tagged **“AI flagged for review”**.

---

## Mapping to SRS

- **Functional Requirements**
  - **FR-01 / FR-02** – Admin creates forms; end-users fill and submit them.
  - **FR-03** – Client-side checks (required, format) in `FormFillPage.jsx` + backend checks.
  - **FR-04 / FR-05** – AI-powered sentiment & entity checks in `submissions.js` using `googleNlp.js`.
  - **FR-06** – Unified validation feedback and readable AI messages in submission response.
  - **FR-07** – Persistent storage via Sequelize models `Form`, `FormField`, `Submission`, `SubmissionData`.
- **Non-functional Requirements**
  - Security: JWT auth + role-based access for admin endpoints, HTTPS recommended in deployment.
  - Reliability: Google NLP failures log an error and gracefully fall back to basic validation.
  - Maintainability: Clear separation of routes, models, services, and React pages.

---

## Testing Tips

- Use browser DevTools **Network** tab to inspect API calls and responses.
- Check backend console for:
  - `Smart Form Validator API listening on port 4000`
  - Any AI validation errors or DB issues.
- Temporarily set `GCLOUD_NLP_ENABLED=false` in `.env` if you want to test without Google credentials.

---

## Future Enhancements (from SRS)

The codebase currently focuses on the core flow. Additional SRS items you can implement next:

- Email notifications (SendGrid/SES) for registration, alerts, and submission events
- WebSocket real-time updates for validation status and analytics
- Detailed analytics endpoints (`/api/analytics`) for admin dashboards
- Rate limiting and advanced audit logging for compliance and cost control

This `README.md` is designed to match your SRS and make it easy for anyone (instructors, teammates, or evaluators) to run and understand your Smart Form Validator project.


