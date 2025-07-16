import React, { useState, useEffect } from 'react';
import SideBar from '../components/side_bar';
import TopNavbar from '../components/top_navbar';
import axios from 'axios';
import './css/auditLogViewer.css';
import { useNavigate } from 'react-router-dom';

const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    performedBy: '',
    startDate: '',
    endDate: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const apiUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Session expired. Please log in again.');
      navigate('/');
      return;
    }

    const verifyAdmin = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.isAdmin) {
          alert('You are not authorized to access this page.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error verifying admin:', error);
        alert('Session expired. Please log in again.');
        navigate('/');
      }
    };

    verifyAdmin();
  }, [navigate, apiUrl]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await axios.get(`${apiUrl}/api/admin/audit-logs?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuditLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showNotification('Error fetching audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      targetType: '',
      performedBy: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'ban': return '#dc3545';
      case 'unban': return '#28a745';
      case 'soft-delete': return '#ffc107';
      case 'order-status-change': return '#17a2b8';
      case 'role-change': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getTargetTypeIcon = (targetType) => {
    switch (targetType) {
      case 'User': return '👤';
      case 'Listing': return '📦';
      case 'PaymentMethod': return '💳';
      case 'Order': return '📋';
      default: return '📄';
    }
  };

  return (
    <div className="audit-log-viewer-container">
      <TopNavbar />
      <div className="dashboard-content">
        <SideBar />
        <div className="audit-log-main">
          <button className="back-button" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
          <h1>Audit Logs</h1>
          
          <div className="filters-section">
            <h3>Filters</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Action:</label>
                <select 
                  value={filters.action} 
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">All Actions</option>
                  <option value="ban">Ban</option>
                  <option value="unban">Unban</option>
                  <option value="soft-delete">Soft Delete</option>
                  <option value="order-status-change">Order Status Change</option>
                  <option value="role-change">Role Change</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Target Type:</label>
                <select 
                  value={filters.targetType} 
                  onChange={(e) => handleFilterChange('targetType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="User">User</option>
                  <option value="Listing">Listing</option>
                  <option value="PaymentMethod">Payment Method</option>
                  <option value="Order">Order</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label>End Date:</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
            
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="audit-logs-table-container">
            {loading ? (
              <p>Loading audit logs...</p>
            ) : (
              <table className="audit-logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Performed By</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <span 
                          className="action-badge"
                          style={{ backgroundColor: getActionColor(log.action) }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="target-info">
                          {getTargetTypeIcon(log.targetType)} {log.targetType}
                        </span>
                        <br />
                        <small>ID: {log.targetId}</small>
                      </td>
                      <td>
                        {log.performedBy ? (
                          <div>
                            <div>{log.performedByEmail}</div>
                            <small>ID: {log.performedBy._id}</small>
                          </div>
                        ) : (
                          'System'
                        )}
                      </td>
                      <td>
                        <div className="details-cell">
                          {log.details && (
                            <div>
                              {log.details.reason && (
                                <div><strong>Reason:</strong> {log.details.reason}</div>
                              )}
                              {log.details.oldStatus && log.details.newStatus && (
                                <div>
                                  <strong>Status Change:</strong> {log.details.oldStatus} → {log.details.newStatus}
                                </div>
                              )}
                              {log.details.ipAddress && (
                                <div><strong>IP:</strong> {log.details.ipAddress}</div>
                              )}
                              {log.details.targetUserEmail && (
                                <div><strong>Target:</strong> {log.details.targetUserEmail}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {notification.show && (
        <div className={`notification-popup ${notification.type}`}>
          <p>{notification.message}</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer; 