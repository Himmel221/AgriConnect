import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

 
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'authToken' && !event.newValue) {
        setIsAuthenticated(false);
        setToken(null);
        setUserId(null);
        setUser(null);
        setRefreshToken(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setToken(null);
      setUserId(null);
      setUser(null);
      setRefreshToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Update isAuthenticated when token changes
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('authToken'));
    setToken(localStorage.getItem('authToken'));
  }, [localStorage.getItem('authToken')]);

  const validateToken = async (token) => {
    return !!token;
  };

  const login = (authToken, userData, refreshTokenData) => {
    if (!authToken || !userData || !userData._id) {
      return;
    }
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', userData.isAdmin);
    localStorage.setItem('userType', userData.userType || 'user');
    if (refreshTokenData) {
      localStorage.setItem('refreshToken', refreshTokenData);
    }
    setToken(authToken);
    setUserId(userData._id);
    setUser(userData);
    if (refreshTokenData) {
      setRefreshToken(refreshTokenData);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userType');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUserId(null);
    setUser(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-logout'));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUserStr = localStorage.getItem('user');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedToken && storedUserStr) {
        try {
          const userData = JSON.parse(storedUserStr);
          const isValid = await validateToken(storedToken);
          if (isValid && userData && userData._id) {
            setToken(storedToken);
            setUserId(userData._id);
            setUser(userData);
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken);
            }
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userId,
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};