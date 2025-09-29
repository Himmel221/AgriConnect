import React, { useEffect, useState } from 'react';
import './css/adminDashboard.css';
import SideBar from '../components/side_bar';
import TopNavbar from '../components/top_navbar';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const validateAdminAccess = async () => {
      const userFromStorage = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('authToken');
      const userType = localStorage.getItem('userType');

      if (!userFromStorage || !token) {
        console.error('Missing user or token in localStorage.');
        navigate('/');
        return;
      }

      if (userType !== 'admin' && userType !== 'super_admin') {
        console.warn('User is not an admin.');
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(`${apiUrl}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        
        // Fetch online users count
        try {
          const onlineResponse = await axios.get(`${apiUrl}/api/admin/online-users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOnlineUsers(onlineResponse.data.count || 0);
        } catch (onlineError) {
          console.warn('Failed to fetch online users count:', onlineError);
          setOnlineUsers(0);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    validateAdminAccess();
  }, [navigate]);

  const [onlineUsers, setOnlineUsers] = useState(0);
  
  const totalUsers = users.length;
  const verifiedSellers = users.filter(user => user.userType === 'seller' && user.isVerified).length;

  const maxUsers = 200; 
  const totalUsersPercent = Math.round((totalUsers / maxUsers) * 100);
  const onlineUsersPercent = totalUsers ? Math.round((onlineUsers / totalUsers) * 100) : 0;
  const verifiedSellersPercent = totalUsers ? Math.round((verifiedSellers / totalUsers) * 100) : 0;

  if (loading) {
    return <div className="admin-dashboard-loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <TopNavbar />
      <div className="dashboard-content">
        <SideBar />
        <div className="dashboard-main">
          <div className="admin-dashboard">
            <h1>Admin Panel</h1>
          </div>

          {/* Statistics Section */}
          <div className="stats-container">
            <div className="stat-card" onClick={() => navigate('/manage-users')} style={{cursor: 'pointer'}}>
              <h3>Total Users</h3>
              <p>{totalUsers}</p>
              <div className="small-circular">
                <CircularProgressbar
                  value={totalUsersPercent}
                  text={`${totalUsersPercent}%`}
                  styles={buildStyles({
                    textSize: '28px',
                    textColor: '#ffffff',
                    pathColor: '#4D7C2E',
                    trailColor: '#f5f5f5',
                  })}
                />
              </div>
            </div>
            <div className="stat-card">
              <h3>Online Users</h3>
              <p>{onlineUsers}</p>
              <div className="small-circular">
                <CircularProgressbar
                  value={onlineUsersPercent}
                  text={`${onlineUsersPercent}%`}
                  styles={buildStyles({
                    textSize: '28px',
                    textColor: '#ffffff',
                    pathColor: '#4D7C2E',
                    trailColor: '#f5f5f5',
                  })}
                />
              </div>
            </div>
            <div className="stat-card">
              <h3>Verified Sellers</h3>
              <p>{verifiedSellers}</p>
              <div className="small-circular">
                <CircularProgressbar
                  value={verifiedSellersPercent}
                  text={`${verifiedSellersPercent}%`}
                  styles={buildStyles({
                    textSize: '28px',
                    textColor: '#ffffff',
                    pathColor: '#007bff',
                    trailColor: '#f5f5f5',
                  })}
                />
              </div>
            </div>
          </div>

          <div className="admin-sections">
            <button className="admin-button" onClick={() => navigate('/manage-users')}>
              Manage Users
            </button>

            <button className="admin-button security-btn" onClick={() => navigate('/security-monitor')}>
              🛡️ Security Monitor
            </button>

            <button className="admin-button audit-btn" onClick={() => navigate('/audit-logs')}>
              📋 Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;