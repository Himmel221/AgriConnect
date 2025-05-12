import React, { useState } from 'react';
import { Box, Button, TextField, Typography, IconButton, Modal, Fade, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const SignUp = ({ open, handleClose, handleOpenSignIn }) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' }); 
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i);

  const handleBirthDateChange = (field, value) => {
    setBirthDate((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    try {
      const formattedBirthDate = new Date(`${birthDate.year}-${birthDate.month}-${birthDate.day}`);
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        birthDate: formattedBirthDate, 
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'User registered successfully. A confirmation email has been sent.');
        setShowSuccess(true);
        // Clear form
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setBirthDate({ day: '', month: '', year: '' });
        setError('');
        
        // Close the signup modal after 3 seconds
        setTimeout(() => {
          handleClose();
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '480px' },
              maxWidth: '95vw',
              maxHeight: '90vh',
              padding: { xs: '1.5rem', sm: '2rem' },
              borderRadius: '16px',
              boxShadow: 3,
              backgroundColor: 'white',
              overflowY: 'auto'
            }}
          >
            <IconButton 
              onClick={handleClose} 
              sx={{ 
                position: 'absolute',
                top: 8,
                left: 8,
                color: '#2E7D32'
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                textAlign: 'center', 
                fontWeight: 'bold', 
                color: '#2E7D32',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Sign up to AgriConnect
            </Typography>
            
            {error && (
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ 
                  mb: 2,
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  padding: '8px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {error}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="First Name"
                variant="outlined"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Middle Name"
                variant="outlined"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Last Name"
                variant="outlined"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 0.5 }}
              />
              
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="Confirm Password"
                type="password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 1 }}
              />
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mt: 1, 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Birth Date:
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 },
                mb: 2 
              }}>
                <Select
                  value={birthDate.day}
                  onChange={(e) => handleBirthDateChange('day', e.target.value)}
                  displayEmpty
                  fullWidth
                  size="small"
                  sx={{ mb: { xs: 1, sm: 0 } }}
                >
                  <MenuItem value="" disabled>Day</MenuItem>
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
                
                <Select
                  value={birthDate.month}
                  onChange={(e) => handleBirthDateChange('month', e.target.value)}
                  displayEmpty
                  fullWidth
                  size="small"
                  sx={{ mb: { xs: 1, sm: 0 } }}
                >
                  <MenuItem value="" disabled>Month</MenuItem>
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index + 1}>{month}</MenuItem>
                  ))}
                </Select>
                
                <Select
                  value={birthDate.year}
                  onChange={(e) => handleBirthDateChange('year', e.target.value)}
                  displayEmpty
                  fullWidth
                  size="small"
                >
                  <MenuItem value="" disabled>Year</MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleSignUp}
                sx={{ 
                  mt: 1,
                  py: { xs: 0.8, sm: 1 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                SIGN UP
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SignUp;
