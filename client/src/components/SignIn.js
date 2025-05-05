//SignIn.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Modal, Backdrop, Fade, IconButton, InputAdornment, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import axios from 'axios';
import { useAuth } from './AuthProvider';

const SignIn = ({ open, handleClose, handleOpenSignUp }) => {
  const { login } = useAuth(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate()

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSignIn = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });
  
      console.log('Login API response:', response.data);
  
      const { userId, token, isAdmin, isVerified, userType } = response.data;
  
      if (!userId || !token) {
        throw new Error('Invalid response: Missing userId or token.');
      }
  
      const userData = {
        _id: userId,
        isAdmin: isAdmin || false,
        isVerified: isVerified || false,
        userType: userType || 'user',
        email: email
      };
  
      login(token, userData);
      
      alert('Login successful');
      setEmail('');
      setPassword('');
      setError('');
      handleClose();
    } catch (error) {
      console.error('Error in handleSignIn:', error);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };
  
  const handleSignUpClick = () => {
    handleClose();
    handleOpenSignUp();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
        }
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            display: 'flex',
            width: { xs: '90%', sm: '800px' },
            height: { xs: 'auto', sm: '500px' },
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 1300,
          }}
        >
          {}
          <Box
            sx={{
              width: { xs: '100%', sm: '40%' },
              backgroundColor: '#4D7C2E',
              color: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              padding: '2rem',
              backgroundImage: 'linear-gradient(135deg, #4D7C2E 0%, #2E5C1A 100%)',
            }}
          >
            <IconButton 
              onClick={handleClose} 
              sx={{ 
                position: 'absolute', 
                top: 16, 
                left: 16, 
                color: '#FFF',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box 
                component="img" 
                src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" 
                alt="AgriConnect Logo" 
                sx={{ 
                  width: '80px', 
                  height: '80px',
                  mb: 2,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }} 
              />
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
                Sign in to continue to AgriConnect
              </Typography>
              

              
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Your trusted agricultural marketplace
              </Typography>
            </Box>
          </Box>
          
          {/* Right side - Form */}
          <Box
            sx={{
              width: { xs: '100%', sm: '60%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: { xs: '2rem', sm: '3rem' },
              backgroundColor: '#ffffff',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: { xs: 'block', sm: 'none' } }}>
              Sign in to AgriConnect
            </Typography>
            
            {error && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2, 
                  color: '#d32f2f',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  padding: '10px',
                  borderRadius: '4px',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {error}
              </Typography>
            )}
            
            <TextField
              fullWidth
              margin="normal"
              label="Email / Phone Number"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#4D7C2E' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4D7C2E',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4D7C2E',
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#4D7C2E' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4D7C2E',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4D7C2E',
                  },
                },
              }}
            />
            
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography
                variant="body2"
                sx={{ 
                  cursor: 'pointer', 
                  color: '#4D7C2E',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleSignIn}
              sx={{ 
                mt: 2, 
                mb: 2,
                backgroundColor: '#4D7C2E',
                color: 'white',
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 8px rgba(77, 124, 46, 0.3)',
                '&:hover': {
                  backgroundColor: '#3d6a25',
                  boxShadow: '0 6px 12px rgba(77, 124, 46, 0.4)',
                }
              }}
            >
              Sign In
            </Button>
            
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 2 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Google')}
              sx={{ 
                mb: 3,
                borderColor: '#ddd',
                color: '#333',
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  borderColor: '#4D7C2E',
                  backgroundColor: 'rgba(77, 124, 46, 0.05)',
                }
              }}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Don't have an account?{' '}
              <span 
                onClick={handleSignUpClick} 
                style={{ 
                  color: '#4D7C2E', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign Up
              </span>
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default SignIn;