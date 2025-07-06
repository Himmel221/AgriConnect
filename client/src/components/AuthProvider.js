import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  const validateToken = async (token) => {
    return !!token;
  };

  const login = (authToken, userData) => {
    console.log("Login function called with:", { authToken, userData });

    if (!authToken || !userData || !userData._id) {
      console.error("Invalid login data:", { authToken, userData });
      return;
    }

    localStorage.setItem("authToken", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAdmin", userData.isAdmin);
    localStorage.setItem("userType", userData.userType || 'user');

    setToken(authToken);
    setUserId(userData._id);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userType");
    setToken(null);
    setUserId(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      const storedUserStr = localStorage.getItem("user");

      console.log("Retrieved from localStorage:", { token: storedToken, userStr: storedUserStr });

      if (storedToken && storedUserStr) {
        try {
          const userData = JSON.parse(storedUserStr);
          const isValid = await validateToken(storedToken);

          if (isValid && userData && userData._id) {
            setToken(storedToken);
            setUserId(userData._id);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log("Token validation failed or invalid user data");
            logout();
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          logout();
        }
      } else {
        console.log("No authentication data found");
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