import React, { useState, useEffect, useCallback } from 'react';
import SideBar from '../components/side_bar';
import TopNavbar from '../components/top_navbar';
import axios from 'axios';
import './css/manageUsers.css';
import { useNavigate } from 'react-router-dom';

const ManageUsers = () => {
  const [searchInput, setSearchInput] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUser, setFilteredUser] = useState(null);
  const [showEmails, setShowEmails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const [loading, setLoading] = useState(false); 
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [banModal, setBanModal] = useState({ open: false, userId: null });
  const [banReason, setBanReason] = useState('');
  const [unbanModal, setUnbanModal] = useState({ open: false, userId: null });
  const [unbanReason, setUnbanReason] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();

  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleExpiredSession = useCallback(() => {
    console.log('Auth Token:', localStorage.getItem('authToken'));
    alert('Session expired. Please log in again.');
    navigate('/'); 
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      handleExpiredSession();
      return;
    }

    const verifyAdmin = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        console.log('Verify Admin Response:', response.data); 
    
        if (!response.data.isAdmin) {
          console.log('User is NOT an admin'); 
          console.log('Auth Token:', localStorage.getItem('authToken'));
          alert('You are not authorized to access this page.');
          navigate('/'); 
        } else {
          console.log('User IS an admin'); 
        }
      } catch (error) {
        console.error('Error verifying admin:', error);
        if (error.response?.status === 403) {

        }
        handleExpiredSession();
      }
    };

    verifyAdmin();
  }, [handleExpiredSession, navigate]);

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      handleExpiredSession();
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        handleExpiredSession();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [handleExpiredSession, navigate]);

  const handleSearch = () => {
    const user = users.find((u) => u.email.toLowerCase() === searchInput.trim().toLowerCase());
    
    if (!user) {
      showNotification('No user found with that email.', 'error');
    }
  
    setFilteredUser(user || null);
  };

  const toggleEmailVisibility = (userId) => {
    setShowEmails((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const formatEmail = (email, isVisible) => {
    if (isVisible) return email;
    const [prefix, domain] = email.split('@');
    const visibleStart = Math.min(2, prefix.length);
    const visibleEnd = Math.min(2, prefix.length - visibleStart);
    const hiddenLength = prefix.length - visibleStart - visibleEnd;

    const hiddenPart = '*'.repeat(hiddenLength);
    return `${prefix.slice(0, visibleStart)}${hiddenPart}${prefix.slice(prefix.length - visibleEnd)}@${domain}`;
  };

  const handleApproveSeller = async (userId) => {
    try {
      const response = await axios.patch(
        `${apiUrl}/api/users/approve-seller/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );

      if (response.status === 200) {
        showNotification('Seller approved successfully!', 'success');
        const updatedUsers = users.map((user) =>
          user.userId === userId ? { ...user, userType: 'seller' } : user
        );
        setUsers(updatedUsers);
      } else {
        console.error('Failed to approve seller:', response.data);
        showNotification(response.data.message || 'Failed to approve seller.', 'error');
      }
    } catch (error) {
      console.error('Error approving seller:', error.message);
      showNotification(error.response?.data?.message || 'Error approving seller. Please try again.', 'error');
    }
  };

  const handleRemoveSeller = async (userId) => {
    try {
      const response = await axios.patch(
        `${apiUrl}/api/users/remove-seller/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );

      if (response.status === 200) {
        showNotification('Seller role removed successfully!', 'success');
        const updatedUsers = users.map((user) =>
          user.userId === userId ? { ...user, userType: 'user' } : user
        );
        setUsers(updatedUsers);
      } else {
        console.error('Failed to remove seller role:', response.data);
        showNotification('Failed to remove seller role.', 'error');
      }
    } catch (error) {
      console.error('Error removing seller role:', error.message);
      showNotification('Error removing seller role. Please try again.', 'error');
    }
  };

  const handleBanUser = (userId) => {
    setBanModal({ open: true, userId });
    setBanReason('');
  };

  const confirmBanUser = async () => {
    if (!banReason.trim()) {
      showNotification('Ban reason is required.', 'error');
      return;
    }
    try {
      const response = await axios.post(
        `${apiUrl}/api/admin/ban-user/${banModal.userId}`,
        { reason: banReason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setBanModal({ open: false, userId: null });
      setBanReason('');
      if (response.status === 200) {
        await fetchUsers();
        setTimeout(() => {
          showNotification('User banned successfully!', 'success');
        }, 200);
      } else {
        setTimeout(() => {
          showNotification(response.data.message || 'Failed to ban user.', 'error');
        }, 200);
      }
    } catch (error) {
      setBanModal({ open: false, userId: null });
      setBanReason('');
      setTimeout(() => {
        showNotification(error.response?.data?.message || 'Error banning user. Please try again.', 'error');
      }, 200);
    }
  };

  const cancelBanUser = () => {
    setBanModal({ open: false, userId: null });
    setBanReason('');
  };

  // Unban modal logic
  const handleUnbanUser = (userId) => {
    setUnbanModal({ open: true, userId });
    setUnbanReason('');
  };

  const confirmUnbanUser = async () => {
    if (!unbanReason.trim()) {
      showNotification('Unban reason is required.', 'error');
      return;
    }
    try {
      const response = await axios.post(
        `${apiUrl}/api/admin/unban-user/${unbanModal.userId}`,
        { reason: unbanReason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      setUnbanModal({ open: false, userId: null });
      setUnbanReason('');
      if (response.status === 200) {
        await fetchUsers();
        setTimeout(() => {
          showNotification('User unbanned successfully!', 'success');
        }, 200);
      } else {
        setTimeout(() => {
          showNotification(response.data.message || 'Failed to unban user.', 'error');
        }, 200);
      }
    } catch (error) {
      setUnbanModal({ open: false, userId: null });
      setUnbanReason('');
      setTimeout(() => {
        showNotification(error.response?.data?.message || 'Error unbanning user. Please try again.', 'error');
      }, 200);
    }
  };

  const cancelUnbanUser = () => {
    setUnbanModal({ open: false, userId: null });
    setUnbanReason('');
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(users.length / usersPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="admin-manage-user-container">
      <TopNavbar />
      <div className="dashboard-content">
        <SideBar />
        <div className="manage-users-main">
          <button className="back-button" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
          <h1>Manage Users</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by User Email"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                // Real-time search
                if (e.target.value.trim()) {
                  const user = users.find((u) => u.email.toLowerCase().includes(e.target.value.toLowerCase()));
                  setFilteredUser(user || null);
                } else {
                  setFilteredUser(null);
                }
              }}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {filteredUser === null && searchInput.trim().length > 0 && (
            <div className="no-user-found">
              <p>No user found with that email.</p>
            </div>
          )}

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Verified Email</th>
                  <th>Verified Seller</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredUser ? (
                  <tr>
                    <td>
                      {filteredUser.isBanned ? (
                        <span
                          className="banned-user-name"
                          title={`Banned: ${filteredUser.banReason || 'No reason'}\nAt: ${filteredUser.bannedAt ? new Date(filteredUser.bannedAt).toLocaleString() : ''}`}
                        >
                          {`${filteredUser.first_name} ${filteredUser.last_name}`}
                        </span>
                      ) : (
                        `${filteredUser.first_name} ${filteredUser.last_name}`
                      )}
                    </td>
                    <td>
                      {formatEmail(filteredUser.email, showEmails[filteredUser.userId])}
                      <button onClick={() => toggleEmailVisibility(filteredUser.userId)}>
                        {showEmails[filteredUser.userId] ? 'Hide' : 'Show'}
                      </button>
                    </td>
                    <td>
                      <span className={`circle ${filteredUser.isVerified ? 'green' : 'red'}`}></span>
                    </td>
                    <td>
                      <span className={`circle ${filteredUser.userType === 'seller' ? 'green' : 'red'}`}></span>
                      {filteredUser.userType === 'seller' ? (
                        <button className="remove-seller-btn" onClick={() => handleRemoveSeller(filteredUser.userId)}>
                          Remove Seller Role
                        </button>
                      ) : (
                        <button onClick={() => handleApproveSeller(filteredUser.userId)}>
                          Make Seller
                        </button>
                      )}
                    </td>
                    <td>
                      {filteredUser.isBanned ? (
                        <span className="banned-status">BANNED</span>
                      ) : (
                        <span className="active-status">Active</span>
                      )}
                    </td>
                    <td>
                      {filteredUser.isBanned ? (
                        <button className="unban-btn" onClick={() => handleUnbanUser(filteredUser.userId)}>
                          Unban User
                        </button>
                      ) : (
                        <button className="ban-btn" onClick={() => handleBanUser(filteredUser.userId)}>
                          Ban User
                        </button>
                      )}
                    </td>
                    <td>{filteredUser.userId}</td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        {user.isBanned ? (
                          <span
                            className="banned-user-name"
                            title={`Banned: ${user.banReason || 'No reason'}\nAt: ${user.bannedAt ? new Date(user.bannedAt).toLocaleString() : ''}`}
                          >
                            {`${user.first_name} ${user.last_name}`}
                          </span>
                        ) : (
                          `${user.first_name} ${user.last_name}`
                        )}
                      </td>
                      <td>
                        {formatEmail(user.email, showEmails[user.userId])}
                        <button onClick={() => toggleEmailVisibility(user.userId)}>
                          {showEmails[user.userId] ? 'Hide' : 'Show'}
                        </button>
                      </td>
                      <td>
                        <span className={`circle ${user.isVerified ? 'green' : 'red'}`}></span>
                      </td>
                      <td>
                        <span className={`circle ${user.userType === 'seller' ? 'green' : 'red'}`}></span>
                        {user.userType === 'seller' ? (
                          <button className="remove-seller-btn" onClick={() => handleRemoveSeller(user.userId)}>
                            Remove Seller Role
                          </button>
                        ) : (
                          <button onClick={() => handleApproveSeller(user.userId)}>
                            Make Seller
                          </button>
                        )}
                      </td>
                      <td>
                        {user.isBanned ? (
                          <span className="banned-status">BANNED</span>
                        ) : (
                          <span className="active-status">Active</span>
                        )}
                      </td>
                      <td>
                        {user.isBanned ? (
                          <button className="unban-btn" onClick={() => handleUnbanUser(user.userId)}>
                            Unban User
                          </button>
                        ) : (
                          <button className="ban-btn" onClick={() => handleBanUser(user.userId)}>
                            Ban User
                          </button>
                        )}
                      </td>
                      <td>{user.userId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loading && <p>Loading...</p>}

          <div className="pagination-controls">
            <button onClick={goToPreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>{currentPage}</span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Notification Popup */}
      {notification.show && (
        <div className={`notification-popup ${notification.type}`}>
          <p>{notification.message}</p>
        </div>
      )}
      {/* Ban Reason Modal */}
      {banModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Ban User</h2>
            <p>Please provide a reason for banning this user:</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              rows={4}
              style={{ width: '100%', borderRadius: '8px', padding: '8px', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={cancelBanUser} style={{ background: '#ccc', color: '#222' }}>Cancel</button>
              <button
                onClick={confirmBanUser}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  cursor: !banReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: !banReason.trim() ? 0.6 : 1
                }}
                disabled={!banReason.trim()}
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Unban Reason Modal */}
      {unbanModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Unban User</h2>
            <p>Please provide a reason for unbanning this user:</p>
            <textarea
              value={unbanReason}
              onChange={(e) => setUnbanReason(e.target.value)}
              placeholder="Enter unban reason..."
              rows={4}
              style={{ width: '100%', borderRadius: '8px', padding: '8px', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={cancelUnbanUser} style={{ background: '#ccc', color: '#222' }}>Cancel</button>
              <button
                onClick={confirmUnbanUser}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  cursor: !unbanReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: !unbanReason.trim() ? 0.6 : 1
                }}
                disabled={!unbanReason.trim()}
              >
                Unban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
