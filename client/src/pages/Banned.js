import React from 'react';
import { useNavigate } from 'react-router-dom';

const Banned = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: 400,
        width: '100%',
      }}>
        <h1 style={{ color: '#dc3545', fontWeight: 700, marginBottom: '1.5rem' }}>Your account has been banned</h1>
        <p style={{ color: '#555', marginBottom: '2rem' }}>
          If you believe this is a mistake, please contact support.<br />
          You cannot access your account at this time.
        </p>
        <button
          style={{
            background: '#5F8B4C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.8rem 2.5rem',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
          }}
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Banned; 