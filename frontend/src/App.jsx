import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormFillPage from './pages/FormFillPage';
import FormListPage from './pages/FormListPage';
import FormSubmissionsPage from './pages/FormSubmissionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './AuthContext';

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute =
    location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      {!isAuthRoute && (
        <header className="topbar">
          <div className="logo">Smart Form Validator</div>
          <nav>
            {user && user.role !== 'admin' && <Link to="/forms">Forms</Link>}
            {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
            {!user ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout ({user.email})
              </button>
            )}
          </nav>
        </header>
      )}
      <main className={isAuthRoute ? 'content content-auth' : 'content'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/forms" element={<FormListPage />} />
          <Route path="/forms/:id" element={<FormFillPage />} />
          <Route
            path="/admin/forms/:id/submissions"
            element={<FormSubmissionsPage />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}


