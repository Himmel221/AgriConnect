import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Modal, Backdrop, Fade, IconButton, InputAdornment, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

const SignIn = ({ open, handleClose, handleOpenSignUp }) => {
  const { login } = useAuth(); 
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSignIn = async () => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });
  
      const { userId, accessToken, refreshToken, isAdmin, isVerified, userType, user } = response.data;
  
      if (!userId || !accessToken) {
        throw new Error('Invalid response: Missing userId or accessToken.');
      }
  
      const userData = {
        _id: userId,
        isAdmin: isAdmin || user?.isAdmin || false,
        isVerified: isVerified || user?.isVerified || false,
        userType: userType || user?.userType || 'user',
        email: email
      };
  
      login(accessToken, userData, refreshToken);
      setEmail('');
      setPassword('');
      setError('');
      handleClose();
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };
  
  const handleSignUpClick = () => {
    handleClose();
    handleOpenSignUp();
  };

  const handleForgotPasswordClick = () => {
    handleClose();
    navigate('/forgot-password');
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
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '90%', sm: '800px' },
            maxWidth: '95vw',
            height: { xs: 'auto', sm: '500px' },
            maxHeight: { xs: '90vh', sm: 'none' },
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            overflow: 'auto',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Left side - Welcome */}
          <Box
            sx={{
              width: { xs: '100%', sm: '40%' },
              minHeight: { xs: '180px', sm: 'auto' },
              backgroundColor: '#4D7C2E',
              color: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              padding: { xs: '1rem', sm: '2rem' },
              backgroundImage: 'linear-gradient(135deg, #4D7C2E 0%, #2E5C1A 100%)',
            }}
          >
            <IconButton 
              onClick={handleClose} 
              sx={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
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
              src="https://i.pinimg.com/originals/85/8e/31/858e31ac1a2f642fb3ab0015d3f1acfa.png" 
              alt="Logo" 
              sx={{ 
                width: { xs: '60px', sm: '80px' }, 
                height: { xs: '60px', sm: '80px' },
                mb: { xs: 1, sm: 2 },
              }} 
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Sign In to continue to Agriconnect
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
              padding: { xs: '1.5rem', sm: '2rem' },
              overflowY: 'auto',
            }}
          >            
            {error && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2, 
                  color: '#d32f2f',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  padding: '8px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '0.875rem'
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
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#4D7C2E' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              variant="outlined"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#4D7C2E' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Typography
                variant="body2"
                onClick={handleForgotPasswordClick}
                sx={{ 
                  color: '#4D7C2E',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }
                }}
              >
                Forgot Password?
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleSignIn}
              size="medium"
              sx={{ 
                mb: 2,
                backgroundColor: '#4D7C2E',
                color: 'white',
                py: 1,
                borderRadius: '8px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#3d6a25',
                }
              }}
            >
              Sign In
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" sx={{ px: 1, fontSize: '0.875rem' }}>
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              size="medium"
              sx={{ 
                mb: 2,
                borderColor: '#ddd',
                color: '#333',
                py: 1,
                borderRadius: '8px',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#4D7C2E',
                }
              }}
            >
              Sign in with Google
            </Button>
            
            <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <span 
                style={{ 
                  color: '#4D7C2E', 
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={handleSignUpClick}
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