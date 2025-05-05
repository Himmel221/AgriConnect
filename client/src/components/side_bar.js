import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, DollarSign, Box, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from './AuthProvider';
import './css/SideBar.css';

const LAT = 15.8646;
const LON = 120.8980;

const Sidebar = ({ handleOpenSignIn }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const user = JSON.parse(localStorage.getItem('user'));
  const [apiKey, setApiKey] = useState('');
  const [weather, setWeather] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const apiUrl = process.env.REACT_APP_API_URL;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-collapse sidebar when window width is below threshold
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check on component mount
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/api/weather-key`) 
      .then(response => response.json())
      .then(data => setApiKey(data.apiKey))
      .catch(error => console.error('Error fetching weather API key:', error));
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
          console.log('Weather API Response:', data);
          setWeather(data);
        })
        .catch(error => console.error('Error fetching weather data:', error));
    }
  }, [apiKey]);

  const handleSellingClick = () => {
    if (isAuthenticated) {
      navigate('/sell-area');
    } else {
      handleOpenSignIn();
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="sidebar-wrapper">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-content">
          <div className={`weather-widget ${isCollapsed ? 'mini-weather' : ''}`}>
            {weather && weather.weather && weather.weather.length > 0 ? (
              <div>
                {(!isCollapsed || windowWidth > 768) && <h4>{weather.name}</h4>}
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                  alt="Weather Icon" 
                  className={isCollapsed ? 'small-icon' : ''}
                />
                {(!isCollapsed || windowWidth > 768) ? (
                  <>
                    <p>{weather.weather[0].description}</p>
                    <p>{weather.main.temp}°C</p>
                  </>
                ) : (
                  <p className="temp-only">{Math.round(weather.main.temp)}°</p>
                )}
              </div>
            ) : (
              <p>{isCollapsed ? '...' : 'Loading weather...'}</p>
            )}
          </div>

          <Link to="/" className="icon-button">
            <Home className="icon" />
            {(!isCollapsed || windowWidth > 1024) && <span className="text-sm">Home</span>}
          </Link>

          <button 
            className="icon-button" 
            onClick={() => {
              if (isAuthenticated) {
                navigate('/buy-area');
              } else {
                handleOpenSignIn(); 
              }
            }}
          >
            <ShoppingCart className="icon" />
            {(!isCollapsed || windowWidth > 1024) && <span className="text-sm">Buying</span>}
          </button>

          <button className="icon-button" onClick={handleSellingClick}>
            <DollarSign className="icon" />
            {(!isCollapsed || windowWidth > 1024) && <span className="text-sm">Selling</span>}
          </button>

          <button 
            className="icon-button inventory-button" 
            onClick={() => {
              if (isAuthenticated) {
                navigate('/inventory');
              } else {
                handleOpenSignIn(); 
              }
            }}
          >
            <Box className="icon" />
            {(!isCollapsed || windowWidth > 1024) && <span className="text-sm">Inventory</span>}
          </button>

          {user?.isAdmin && (
            <Link to="/admin" className="icon-button">
              <User className="icon" />
              {(!isCollapsed || windowWidth > 1024) && <span className="text-sm">Admin</span>}
            </Link>
          )}
        </div>
      </aside>
      
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  );
};

export default Sidebar;