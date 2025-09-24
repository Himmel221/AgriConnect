// src/pages/ForgotPassword.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      setMessage(response.data.message);
      setEmail('');
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8f5e9' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 h-3"></div>
        
        <div className="py-8 px-8">
          <div className="flex justify-center mb-6">
            <img 
              src="https://i.pinimg.com/originals/85/8e/31/858e31ac1a2f642fb3ab0015d3f1acfa.png" 
              alt="AgriConnect Logo" 
              className="w-16 h-16"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#2E7D32' }}>Forgot Password</h2>
          <p className="text-center text-gray-600 mb-6">Enter your email address to reset your password</p>
          
          {message && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <div className="flex">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>{message}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  className="pl-10 w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-md transition duration-300 flex justify-center items-center"
              style={{ backgroundColor: '#4D7C2E' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#3d6a25'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4D7C2E'}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
          
         <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="font-medium transition duration-300"
              style={{ color: '#4D7C2E' }}
              onMouseEnter={(e) => e.target.style.color = '#3d6a25'}
              onMouseLeave={(e) => e.target.style.color = '#4D7C2E'}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
