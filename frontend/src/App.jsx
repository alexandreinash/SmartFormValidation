import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormFillPage from './pages/FormFillPage';
import FormSubmissionsPage from './pages/FormSubmissionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './AuthContext';

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Smart Form Validator</div>
        <nav>
          <Link to="/forms/1">Sample Form</Link>
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
      <main className="content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/forms/:id" element={<FormFillPage />} />
          <Route
            path="/admin/forms/:id/submissions"
            element={<FormSubmissionsPage />}
          />
          <Route
            path="*"
            element={
              <div>
                <h2>Welcome</h2>
                <p>
                  Use Register/Login to sign in, then open the Admin page or try the
                  sample form.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}


