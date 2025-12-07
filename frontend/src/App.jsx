import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import CreateFormPage from './pages/CreateFormPage';
import TextFormPage from './pages/TextFormPage';
import EmailFormPage from './pages/EmailFormPage';
import NumberFormPage from './pages/NumberFormPage';
import QuizFormPage from './pages/QuizFormPage';
import FormFillPage from './pages/FormFillPage';
import UserFormSelectionPage from './pages/UserFormSelectionPage';
import FormSubmissionsPage from './pages/FormSubmissionsPage';
import AdminFormsPage from './pages/AdminFormsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import { useAuth } from './AuthContext';

function AppShell() {
  const location = useLocation();

  const isAuthRoute =
    location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';
  const isAdminDashboard = location.pathname === '/admin';
  const isFormCreationPage = 
    location.pathname === '/admin/create-form' ||
    location.pathname === '/text-form' ||
    location.pathname === '/email-form' ||
    location.pathname === '/number-form' ||
    location.pathname === '/quiz-form' ||
    location.pathname === '/user/forms';

  return (
    <div className="app">
      <main className={isAuthRoute || isHomePage || isAdminDashboard || isFormCreationPage ? 'content content-auth' : 'content'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create-form" element={<CreateFormPage />} />
          <Route path="/text-form" element={<TextFormPage />} />
          <Route path="/email-form" element={<EmailFormPage />} />
          <Route path="/number-form" element={<NumberFormPage />} />
          <Route path="/quiz-form" element={<QuizFormPage />} />
          <Route path="/forms" element={<Navigate to="/user/forms" replace />} />
          <Route path="/user/forms" element={<UserFormSelectionPage />} />
          <Route path="/forms/:id" element={<FormFillPage />} />
          <Route
            path="/admin/forms/:id/submissions"
            element={<FormSubmissionsPage />}
          />
          <Route
            path="/admin/submissions/all"
            element={<FormSubmissionsPage />}
          />
          <Route
            path="/admin/forms/all"
            element={<AdminFormsPage />}
          />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}


