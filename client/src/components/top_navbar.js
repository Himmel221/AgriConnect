import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Bell, Menu, Wallet, Users, BadgeCheck, User, Settings, LogOut } from "lucide-react"; 
import { useAuth } from "./AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/TopNavbar.css";

const TopNavbar = ({ handleOpenSignIn, onSearch }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isAuthenticated, logout, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("products"); 
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const calculateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(totalItems);
  };

  useEffect(() => {
    if (isAuthenticated) {
      calculateCartCount();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchChange = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (searchMode === "products" && onSearch) {
      onSearch(query);
    } else if (searchMode === "users" && query.trim()) {
      try {
        const response = await axios.get(
          `${apiUrl}/api/users/search/${query}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Search results:", response.data);
        
        // Fetch seller status for each user
        const usersWithSellerStatus = await Promise.all(
          response.data.map(async (user) => {
            try {
              const sellerResponse = await axios.get(
                `${apiUrl}/api/users/seller-status/${user._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log("Seller status for", user._id, ":", sellerResponse.data);
              return { 
                ...user, 
                isSeller: sellerResponse.data.isSeller || false 
              };
            } catch (error) {
              console.error("Error fetching seller status:", error);
              return { ...user, isSeller: false };
            }
          })
        );
        
        console.log("Final results with seller status:", usersWithSellerStatus);
        setSearchResults(usersWithSellerStatus);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === "Enter") {
      if (searchMode === "products" && onSearch) {
        onSearch(searchQuery);
      }
      setShowResults(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/view-profile/${userId}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === "products" ? "users" : "products");
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  if (isLoading) {
    console.log("TopNavbar - Loading...");
    return null;
  }

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <h1 className="navbar-title">AgriConnect</h1>
        <div className="navbar-search">
          <div className="navbar-search-container">
            <input
              type="text"
              placeholder={searchMode === "products" ? "Search products..." : "Search users..."}
              className="navbar-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyPress}
            />
            <button 
              className={`navbar-search-mode-toggle ${searchMode === "users" ? "active" : ""}`}
              onClick={toggleSearchMode}
              title={searchMode === "products" ? "Switch to user search" : "Switch to product search"}
            >
              <Users size={18} />
            </button>
          </div>
          
          {showResults && searchMode === "users" && searchResults.length > 0 && (
            <div className="navbar-search-results">
              {searchResults.map(user => (
                <div 
                  key={user._id} 
                  className="navbar-search-result-item"
                  onClick={() => handleUserClick(user._id)}
                >
                  <Users size={16} />
                  <span className="navbar-user-name">{user.first_name} {user.last_name}</span>
                  {user.isSeller && <span className="navbar-seller-badge">Seller</span>}
                </div>
              ))}
            </div>
          )}

          {!isAuthenticated ? (
            <button className="navbar-sign-in-button" onClick={handleOpenSignIn}>
              Sign In
            </button>
          ) : (
            <div className="navbar-user-options">
              <Link to="/cart">
                <button className="navbar-icon-button">
                  <ShoppingCart className="navbar-icon" />
                  {cartCount > 0 && <span className="navbar-cart-count">{cartCount}</span>}
                </button>
              </Link>
              <button className="navbar-icon-button">
                <Bell className="navbar-icon" />
              </button>
              <button className="navbar-icon-button" onClick={() => navigate("/withdraw")}>
                <Wallet className="navbar-icon" />
              </button>
              <div className="navbar-dropdown">
                <button className="navbar-dropdown-toggle" onClick={handleDropdownToggle}>
                  <Menu className="navbar-icon" />
                </button>
                {dropdownOpen && (
                  <div className="navbar-dropdown-menu">
                    <div className="navbar-dropdown-section">
                      <button className="navbar-dropdown-item" onClick={() => navigate("/profile")}>
                        <User size={16} className="navbar-dropdown-icon" />
                        Profile
                      </button>
                      <button className="navbar-dropdown-item" onClick={() => navigate("/settings")}>
                        <Settings size={16} className="navbar-dropdown-icon" />
                        Settings
                      </button>
                    </div>
                    <div className="navbar-dropdown-divider"></div>
                    <div className="navbar-dropdown-section">
                      <button className="navbar-dropdown-item" onClick={handleLogout}>
                        <LogOut size={16} className="navbar-dropdown-icon" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
