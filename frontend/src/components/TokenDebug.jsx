// frontend/src/components/TokenDebug.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TokenDebug() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token Debug Info:');
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    
    if (token) {
      // Try to decode the token (JWT has 3 parts separated by dots)
      const parts = token.split('.');
      console.log('Token parts:', parts.length);
      
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
          console.log('Token expiry:', new Date(payload.exp * 1000));
          console.log('Current time:', new Date());
          console.log('Token expired?', Date.now() >= payload.exp * 1000);
        } catch (error) {
          console.log('Error decoding token:', error);
        }
      }
    }
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f5f5f5' }}>
      <h2>Token Debug Information</h2>
      <p>Check the browser console (F12) for detailed token information.</p>
      <button onClick={() => navigate('/admin')}>Back to Admin</button>
    </div>
  );
}

export default TokenDebug;