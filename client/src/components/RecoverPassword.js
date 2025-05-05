//RecoverPassword.js

import React, { useState } from 'react';
import axios from 'axios';
import './css/RecoverPassword.css'; 

const RecoverPassword = ({ handleClose }) => {

  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });

      if (response.status === 200) {
        setSuccessMessage(response.data.message); 
      } else {
        setErrorMessage(response.data.message || 'Failed to send password reset link.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recover-password-container">
      <h2>Recover Password</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email Address:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <button type="button" onClick={handleClose}>
        Close
      </button>
    </div>
  );
};

export default RecoverPassword;