/*Settings.js*/

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './css/Settings.css';
import { useAuth } from '../components/AuthProvider';
import { Home, ShoppingCart, DollarSign, MessagesSquare } from 'lucide-react';
import {
  Lock,
  Mail,
  Eye,
  Shield,
  Activity,
  User,
  Bell,
  LogOut
} from "lucide-react"; 
import TopNavbar from '../components/top_navbar';

const Settings = () => {
  const { token, isAuthenticated, logout, user: authUser } = useAuth();
  const [activeSection, setActiveSection] = useState('email');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessaging: true
  });
  const [activityLog, setActivityLog] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    type: 'all',
    date: 'all'
  });

  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(() => {
    const savedCooldown = localStorage.getItem('verificationCooldown');
    const savedTimestamp = localStorage.getItem('verificationCooldownTimestamp');
    if (savedCooldown && savedTimestamp) {  
      const remainingTime = Math.max(0, parseInt(savedCooldown) - Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000));
      return remainingTime;
    }
    return 0;
  });
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const [codeExpiryTime, setCodeExpiryTime] = useState(0);
  const [codeExpiryTimer, setCodeExpiryTimer] = useState(null);
  const [language, setLanguage] = useState('english');
  const [accessibilityStatus, setAccessibilityStatus] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('');
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('');
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [passwordDetails, setPasswordDetails] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    }
    const savedLanguage = localStorage.getItem('language') || 'english';
    setLanguage(savedLanguage);
    const savedPrivacy = JSON.parse(localStorage.getItem('privacySettings')) || {
      profileVisibility: 'public',
      activityStatus: true,
      emailNotifications: true,
      pushNotifications: true,
    };
    setPrivacySettings(savedPrivacy);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setIsVerified(authUser.isVerified);
      setEmail(authUser.email);
      // Only fetch from backend if verified
      if (authUser.isVerified) {
        const fetchUserData = async () => {
          try {
            const response = await axios.get(`${apiUrl}/api/auth/user`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
            setIsVerified(response.data.isVerified);
            setEmail(response.data.email);
          } catch (error) {
            console.error('Error fetching user data:', error);
            if (error.response?.status === 401) {
              alert('Your session has expired. Please log in again.');
              logout();
              navigate('/login');
            }
          }
        };
        fetchUserData();
      }
    }
  }, [authUser, token, logout, navigate]);

  useEffect(() => {
    if (location.state?.fromChatbox) {
      setActiveSection('email');
    }
  }, [location]);

  const handlePasswordDetailsChange = (e) => {
    const { name, value } = e.target;
    setPasswordDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    if (passwordDetails.newPassword !== passwordDetails.confirmPassword) {
      setPasswordChangeStatus('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/auth/change-password`,
        {
          currentPassword: passwordDetails.currentPassword,
          newPassword: passwordDetails.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordChangeStatus(response.data.message || 'Password changed successfully');
      setPasswordDetails({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordChangeStatus(
        error.response?.data?.message || 'This part is still under development'
      );
    }
    setIsLoading(false);
  };

  const handleSendVerificationEmail = async () => {
    const token = localStorage.getItem('authToken');
    setIsLoading(true);
    
    if (token && email) {
      try {
        const response = await axios.post(
          `${apiUrl}/api/auth/send-verification-email`,
          { 
            email,
            attemptCount: verificationAttempts + 1 
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Verification email sent:', response.data);
        setEmailSent(true);
        setVerificationStatus('Verification email sent successfully.');
        

        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);
        setCooldownTime(response.data.cooldownDuration);
        

        setCodeExpiryTime(15 * 60); 
        const codeExpiryTimer = setInterval(() => {
          setCodeExpiryTime(prev => {
            if (prev <= 1) {
              clearInterval(codeExpiryTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setCodeExpiryTimer(codeExpiryTimer);
        

        const timer = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setCooldownTimer(timer);
      } catch (error) {
        console.error('Error sending verification email:', error);
        if (error.response?.status === 429) {
          setCooldownTime(error.response.data.remainingTime);
          

          let errorMessage = '';
          switch (error.response.data.errorType) {
            case 'COOLDOWN_ACTIVE':
              errorMessage = `Please wait before trying again.`;
              break;
            case 'RESEND_LIMIT_EXCEEDED':
              errorMessage = `Please try again after a whil.`;
              break;
            case 'MAX_ATTEMPTS_REACHED':
              errorMessage = 'Too many resend attempts reached. Please try again later.';
              break;
            default:
              errorMessage = `Please wait before trying again.`;
          }
          
          setVerificationStatus(errorMessage);
          

          const timer = setInterval(() => {
            setCooldownTime(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          setCooldownTimer(timer);
        } else {
          setVerificationStatus(
            `Error: ${error.response?.data?.message || 'Something went wrong'}`
          );
        }
      }
    } else {
      setVerificationStatus('Error: Email is missing. Please refresh and try again.');
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);

    try {
      console.log('Sending Verification:', { email, token: verificationCode });

      const response = await axios.post(`${apiUrl}/api/auth/verify-email`, {
        email,
        token: verificationCode,
      });

      console.log('Verification Response:', response);

      if (response.status === 200) {
        setVerificationStatus(response.data.message);
        setIsVerified(true);
        setVerificationCode(''); 
        

        if (codeExpiryTimer) {
          clearInterval(codeExpiryTimer);
          setCodeExpiryTimer(null);
        }
        setCodeExpiryTime(0);
      } else {
        setVerificationStatus('Error verifying email.');
      }
    } catch (error) {
      console.error('Error during verification:', error.response?.data?.message || error.message);
      

      let errorMessage = '';
      switch (error.response?.data?.errorType) {
        case 'USER_NOT_FOUND':
          errorMessage = 'User not found. Please check your email address.';
          break;
        case 'NO_CODE_FOUND':
          errorMessage = 'No verification code found. Please request a new one.';
          break;
        case 'CODE_EXPIRED':
          errorMessage = 'Verification code has expired. Please request a new one.';
          break;
        case 'INVALID_CODE':
          errorMessage = 'Invalid verification code. Please check and try again.';
          break;
        default:
          errorMessage = error.response?.data?.message || 'Something went wrong';
      }
      
      setVerificationStatus(`Error: ${errorMessage}`);
    }

    setIsVerifying(false);
  };


  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
      if (codeExpiryTimer) {
        clearInterval(codeExpiryTimer);
      }
    };
  }, [cooldownTimer, codeExpiryTimer]);


  useEffect(() => {
    const savedCooldown = localStorage.getItem('verificationCooldown');
    const savedTimestamp = localStorage.getItem('verificationCooldownTimestamp');
    
    if (savedCooldown && savedTimestamp) {
      const remainingTime = Math.max(0, parseInt(savedCooldown) - Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000));
      if (remainingTime > 0) {
        setCooldownTime(remainingTime);
        const timer = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              localStorage.removeItem('verificationCooldown');
              localStorage.removeItem('verificationCooldownTimestamp');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setCooldownTimer(timer);
      } else {
        localStorage.removeItem('verificationCooldown');
        localStorage.removeItem('verificationCooldownTimestamp');
      }
    }
  }, []);

  const toggleLoginAlerts = () => {
    setLoginAlerts(!loginAlerts);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setAccessibilityStatus('Language preference saved');
    setTimeout(() => setAccessibilityStatus(''), 3000);
  };

  const saveAccessibilitySettings = () => {
    setAccessibilityStatus('Accessibility settings saved successfully');
    setTimeout(() => setAccessibilityStatus(''), 3000);
  };

  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const savePrivacySettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
      setPrivacyStatus('Privacy settings saved successfully');
      setTimeout(() => setPrivacyStatus(''), 3000);
    } catch (error) {
      setPrivacyStatus('Error saving privacy settings');
      console.error('Error saving privacy settings:', error);
    }
    setIsLoading(false);
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await axios.delete(`${apiUrl}/api/auth/delete-account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        logout();
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        setPrivacyStatus('Failed to delete account. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleDocumentsToggle = () => {
    setShowVerificationDialog(true);
  };

  const handleVerificationResponse = (approved) => {
    setShowVerificationDialog(false);
    if (approved) {
      setShowDocuments(true);
      setDocumentStatus('Document verification request sent to admin');
      setTimeout(() => setDocumentStatus(''), 3000);
    }
  };

  const handleSettingsClick = (section) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="personal-details-content">
            <div className="section">
              <h2>Personal Details</h2>
              <p className="info-text" style={{ color: '#666', fontStyle: 'italic' }}>
                Settings is still under development. More features coming soon!
              </p>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="password-security-content">
            <h1>Password and Security</h1>
        
            <div className="section">
              <h2>Change Password</h2>
        
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordDetails.currentPassword}
                  onChange={handlePasswordDetailsChange}
                  className="form-input"
                />
              </div>
        
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordDetails.newPassword}
                  onChange={handlePasswordDetailsChange}
                  className="form-input"
                />
              </div>
        
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordDetails.confirmPassword}
                  onChange={handlePasswordDetailsChange}
                  className="form-input"
                />
              </div>
        
              {passwordChangeStatus && (
                <div className={`status-message ${passwordChangeStatus.includes('success') ? 'success' : 'error'}`}>
                  {passwordChangeStatus}
                </div>
              )}
        
              <button 
                onClick={handleChangePassword} 
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
        
            <div className="divider"></div>
        
            <div className="section">
              <h2>Password Requirements</h2>
              <ul className="requirements-list">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
        
            <div className="divider"></div>
        
            <div className="section">
              <h2>Login Alerts</h2>
              <div className="toggle-group">
                <label>Receive alerts for unrecognized logins</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={loginAlerts}
                    onChange={toggleLoginAlerts}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <p className="info-text">
                Get notified when your account is accessed from a new device or browser.
              </p>
            </div>
          </div>
        );        
      case 'notifications':
        return (
          <div className="notifications-content">
              {}
          </div>
        );
      case 'privacy':
        return (
          <div className="privacy-content">
            <h1>Privacy Settings</h1>
            
            <div className="section">
              <h2>About Your Privacy</h2>
              <p className="info-text">
                We value your privacy. In this section, you can manage how your personal information 
                is used and shared on our platform. You're in control of your data — from who can see 
                your profile to how we personalize your experience.
              </p>
            </div>

            <div className="section">
              <h2>Profile Visibility</h2>
              <div className="form-group">
                <label>Who can see your profile</label>
                <select
                  name="profileVisibility"
                  value={privacySettings.profileVisibility}
                  onChange={handlePrivacyChange}
                  className="form-input"
                >
                  <option value="public">Public (Anyone)</option>
                  <option value="friends">Buyers Only</option>
                  <option value="only-me">Only Me</option>
                </select>
              </div>
              <p className="info-text">
                Control who can view your profile information and posts.
              </p>
            </div>

            <div className="divider"></div>

            <div className="section">
              <h2>Activity Status</h2>
              <div className="toggle-group">
                <label>Show when you're online</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="activityStatus"
                    checked={privacySettings.activityStatus}
                    onChange={handlePrivacyChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <p className="info-text">
                Let others know when you're active on the platform.
              </p>
            </div>

            <div className="divider"></div>

            <div className="section danger-zone">
              <h2>Account Deletion</h2>
              <p className="info-text">
                Permanently remove your data and account from our system. This action cannot be undone.
              </p>
              <button 
                onClick={handleAccountDeletion} 
                className="delete-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Delete My Account'}
              </button>
            </div>

            {privacyStatus && (
              <div className={`status-message ${privacyStatus.includes('success') ? 'success' : 'error'}`}>
                {privacyStatus}
              </div>
            )}

            <button 
              onClick={savePrivacySettings} 
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Privacy Settings'}
            </button>
          </div>
        );
      case 'activity':
        return (
          <div className="activity-log-content">
            <div className="section">
              <h2>Recent Activities</h2>
              <p className="info-text">
                View your account's recent activities and access history.
              </p>
              
              <div className="activity-filters">
                <div className="form-group">
                  <label>Filter by activity type</label>
                  <select className="form-input">
                    <option value="all">All Activities</option>
                    <option value="login">Logins</option>
                    <option value="password">Password Changes</option>
                    <option value="profile">Profile Updates</option>
                    <option value="purchase">Purchases</option>
                    <option value="security">Security Events</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Time period</label>
                  <select className="form-input">
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="90days">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
              
              <div className="activity-list">
                {}
                <div className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-sign-in-alt"></i>
                  </div>
                  <div className="activity-details">
                    <h3>Successful login</h3>
                    <p className="activity-description">
                      Logged in from Chrome on Windows 10
                    </p>
                    <p className="activity-meta">
                      <span className="activity-time">Today, 10:30 AM</span>
                      <span className="activity-location">Manila, Philippines</span>
                    </p>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <div className="activity-details">
                    <h3>Password changed</h3>
                    <p className="activity-description">
                      Your password was successfully updated
                    </p>
                    <p className="activity-meta">
                      <span className="activity-time">Yesterday, 2:15 PM</span>
                    </p>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-user-edit"></i>
                  </div>
                  <div className="activity-details">
                    <h3>Profile updated</h3>
                    <p className="activity-description">
                      Changed profile picture and phone number
                    </p>
                    <p className="activity-meta">
                      <span className="activity-time">March 15, 3:45 PM</span>
                    </p>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-shopping-bag"></i>
                  </div>
                  <div className="activity-details">
                    <h3>New purchase</h3>
                    <p className="activity-description">
                      Order #12345 for 10kg of rice
                    </p>
                    <p className="activity-meta">
                      <span className="activity-time">March 10, 9:20 AM</span>
                      <span className="activity-amount">₱1,250.00</span>
                    </p>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className="activity-details">
                    <h3>Security alert</h3>
                    <p className="activity-description">
                      Unusual login attempt from New York, USA
                    </p>
                    <p className="activity-meta">
                      <span className="activity-time">March 5, 11:30 PM</span>
                      <span className="activity-status denied">Blocked</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="load-more-btn">
                Load More Activities
              </button>
            </div>
          </div>
        );
      case 'accessibility':
        return (
          <div className="accessibility-content">
            <h1>Accessibility Settings</h1>

            <div className="section">
              <h2>Appearance</h2>

              <div className="toggle-group">
                <label>Dark Mode</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <p className="info-text">
                Switch between light and dark theme for better visibility.
              </p>
            </div>

            <div className="divider"></div>

            <div className="section">
              <h2>Language Preferences</h2>

              <div className="form-group">
                <label>Select Language</label>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="form-input"
                >
                  <option value="english">English</option>
                  <option value="filipino">Filipino</option>
                </select>
              </div>
              <p className="info-text">
                Choose your preferred language.
              </p>
            </div>

            {accessibilityStatus && (
              <div className={`status-message success`}>
                {accessibilityStatus}
              </div>
            )}

            <button 
              onClick={saveAccessibilitySettings} 
              className="save-btn"
            >
              Save Preferences
            </button>
          </div>
        );
      case 'verify-email':
        return (
          <div className="verify-email-content">
            <h2>Verify Your Email Address</h2>
            
            <div className="verification-section">
              <button
                onClick={handleSendVerificationEmail}
                className="verify-btn"
                disabled={isLoading || cooldownTime > 0}
              >
                {emailSent ? 'Re-send Verification Email' : 'Send Verification Email'}
              </button>
              {verificationStatus && (
                <div className={`status-message ${verificationStatus.includes('Error') ? 'error' : 'success'}`}>
                  {verificationStatus}
                </div>
              )}
              {cooldownTime > 0 && (
                <div className="cooldown-timer">
                  Try again in {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                </div>
              )}
              {codeExpiryTime > 0 && emailSent && (
                <div className="code-expiry-timer">
                  Code expires in {Math.floor(codeExpiryTime / 60)}:{(codeExpiryTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            <div className="verification-input-section">
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                }}
                className="verify-input"
              />
              <button
                onClick={handleVerifyCode}
                className="verify-btn"
                disabled={isVerifying || !verificationCode}
              >
                {isVerifying ? 'Verifying...' : 'Confirm Verification Code'}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="default-content">
            <i className="fas fa-search"></i>
          </div>
        );
    }
  };

  return (
    <div className="settings-page">
      <TopNavbar />
      
      <div className="settings-main-content">
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <ul>
            <li>
              <button 
                className={`settings-link ${activeSection === 'personal' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('personal')}
              >
                <User className="icon" />
                <span className="link-label">Personal Details</span>
              </button>
            </li>
            <li>
              <button 
                className={`settings-link ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('security')}
              >
                <Lock className="icon" />
                <span className="link-label">Password & Security</span>
              </button>
            </li>
            <li>
              <button 
                className={`settings-link ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('notifications')}
              >
                <Bell className="icon" />
                <span className="link-label">Notifications</span>
              </button>
            </li>
            <li>
              <button 
                className={`settings-link ${activeSection === 'privacy' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('privacy')}
              >
                <Shield className="icon" />
                <span className="link-label">Privacy</span>
              </button>
            </li>
            <li>
              <button 
                className={`settings-link ${activeSection === 'activity' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('activity')}
              >
                <Activity className="icon" />
                <span className="link-label">Activity Log</span>
              </button>
            </li>
            <li>
              <button 
                className={`settings-link ${activeSection === 'accessibility' ? 'active' : ''}`}
                onClick={() => handleSettingsClick('accessibility')}
              >
                <Eye className="icon" />
                <span className="link-label">Accessibility</span>
              </button>
            </li>
            {!isVerified && (
              <li>
                <button 
                  className={`settings-link ${activeSection === 'verify-email' ? 'active' : ''}`}
                  onClick={() => handleSettingsClick('verify-email')}
                >
                  <Mail className="icon" />
                  <span className="link-label">Verify Email</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className="settings-content">
          {renderContent()}
          
          {showVerificationDialog && (
            <div className="verification-dialog-overlay">
              <div className="verification-dialog">
                <h3>Document Verification</h3>
                <p>
                  Due to the Data Privacy Act, the seller's documents are hidden. 
                  Would you like to request approval to verify their legitimacy?
                </p>
                <div className="verification-buttons">
                  <button 
                    className="verify-btn yes-btn"
                    onClick={() => handleVerificationResponse(true)}
                  >
                    YES
                  </button>
                  <button 
                    className="verify-btn no-btn"
                    onClick={() => handleVerificationResponse(false)}
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>
          )}

          {documentStatus && (
            <div className="status-message success">
              {documentStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
