import React, { useState, useEffect } from 'react';
import SideBar from '../components/side_bar';
import TopNavbar from '../components/top_navbar';
import axios from 'axios';
import './css/securityMonitor.css';
import { useNavigate } from 'react-router-dom';

const SecurityMonitor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  const [dashboardData, setDashboardData] = useState(null);
  const [securityStats, setSecurityStats] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  

  const [logs, setLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({});
  const [logsFilters, setLogsFilters] = useState({
    eventType: '',
    severity: '',
    ipAddress: ''
  });
  

  const [blockedIPs, setBlockedIPs] = useState([]);
  const [unblockLoading, setUnblockLoading] = useState({});
  

  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
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
        navigate('/');
      }
    };

    verifyAdmin();
  }, [navigate, apiUrl]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
      fetchSecurityStats();
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'blocked') {
      fetchBlockedIPs();
    } else if (activeTab === 'suspicious') {
      fetchSuspiciousActivity();
    }
  }, [activeTab, logsFilters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${apiUrl}/api/security/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${apiUrl}/api/security/stats?hours=24`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurityStats(response.data.data.stats);
      setRealTimeData(response.data.data.realTime);
    } catch (error) {
      console.error('Error fetching security stats:', error);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page,
        limit: 50,
        ...logsFilters
      });
      
      const response = await axios.get(`${apiUrl}/api/security/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLogs(response.data.data.logs);
      setLogsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch security logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${apiUrl}/api/security/blocked-ips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedIPs(response.data.data);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      setError('Failed to fetch blocked IPs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspiciousActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${apiUrl}/api/security/suspicious-activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuspiciousActivity(response.data.data);
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      setError('Failed to fetch suspicious activity');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    try {
      setUnblockLoading(prev => ({ ...prev, [ipAddress]: true }));
      const token = localStorage.getItem('authToken');
      
      await axios.post(`${apiUrl}/api/security/unblock-ip`, 
        { ipAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
        
      fetchBlockedIPs();
      alert(`IP address ${ipAddress} has been unblocked successfully.`);
    } catch (error) {
      console.error('Error unblocking IP:', error);
      alert('Failed to unblock IP address.');
    } finally {
      setUnblockLoading(prev => ({ ...prev, [ipAddress]: false }));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'RATE_LIMIT_EXCEEDED': 'Rate Limit Exceeded',
      'SUSPICIOUS_IP': 'Suspicious IP',
      'BLOCKED_IP': 'Blocked IP',
      'FAILED_AUTH': 'Failed Authentication',
      'UPLOAD_ABUSE': 'Upload Abuse',
      'VERIFICATION_ABUSE': 'Verification Abuse',
      'LOGIN_ATTEMPT': 'Login Attempt',
      'REGISTRATION_ATTEMPT': 'Registration Attempt'
    };
    return labels[eventType] || eventType;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderDashboard = () => (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <h2>Security Dashboard</h2>
        <div className="real-time-indicator">
          <span className="pulse"></span>
          Live Data
        </div>
      </div>

      {dashboardData && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">H</div>
            <div className="stat-content">
              <h3>{dashboardData.summary.eventsLastHour}</h3>
              <p>Events (Last Hour)</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">D</div>
            <div className="stat-content">
              <h3>{dashboardData.summary.eventsLastDay}</h3>
              <p>Events (Last 24h)</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">B</div>
            <div className="stat-content">
              <h3>{dashboardData.summary.currentlyBlocked}</h3>
              <p>Blocked IPs</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">S</div>
            <div className="stat-content">
              <h3>{dashboardData.summary.suspiciousLastHour}</h3>
              <p>Suspicious (Last Hour)</p>
            </div>
          </div>
        </div>
      )}

      {realTimeData && (
        <div className="realtime-section">
          <h3>Real-Time Activity</h3>
          <div className="realtime-grid">
            <div className="realtime-card">
              <h4>Active Connections</h4>
              <span className="realtime-value">{realTimeData.activeConnections}</span>
            </div>
            <div className="realtime-card">
              <h4>Suspicious IPs</h4>
              <span className="realtime-value">{realTimeData.suspiciousIPs}</span>
            </div>
            <div className="realtime-card">
              <h4>Total Requests</h4>
              <span className="realtime-value">{realTimeData.totalRequests}</span>
            </div>
          </div>
        </div>
      )}

      {dashboardData && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>Top Event Types (Last 24h)</h3>
            <div className="chart">
              {dashboardData.topEvents.map((event, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-label">{getEventTypeLabel(event._id)}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(event.count / Math.max(...dashboardData.topEvents.map(e => e.count))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-value">{event.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="security-logs">
      <div className="logs-header">
        <h2>Security Logs</h2>
        <div className="logs-filters">
          <select 
            value={logsFilters.eventType} 
            onChange={(e) => setLogsFilters(prev => ({ ...prev, eventType: e.target.value }))}
          >
            <option value="">All Event Types</option>
            <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
            <option value="SUSPICIOUS_IP">Suspicious IP</option>
            <option value="BLOCKED_IP">Blocked IP</option>
            <option value="FAILED_AUTH">Failed Authentication</option>
            <option value="LOGIN_ATTEMPT">Login Attempt</option>
            <option value="REGISTRATION_ATTEMPT">Registration Attempt</option>
          </select>
          
          <select 
            value={logsFilters.severity} 
            onChange={(e) => setLogsFilters(prev => ({ ...prev, severity: e.target.value }))}
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Filter by IP address"
            value={logsFilters.ipAddress}
            onChange={(e) => setLogsFilters(prev => ({ ...prev, ipAddress: e.target.value }))}
          />
        </div>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Event Type</th>
              <th>IP Address</th>
              <th>Endpoint</th>
              <th>Severity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{getEventTypeLabel(log.eventType)}</td>
                <td className="ip-address">{log.ipAddress}</td>
                <td>{log.endpoint}</td>
                <td>
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(log.severity) }}
                  >
                    {log.severity}
                  </span>
                </td>
                <td>
                  <div className="log-details">
                    {log.details.suspiciousScore && (
                      <span>Score: {log.details.suspiciousScore}</span>
                    )}
                    {log.details.reason && (
                      <span>Reason: {log.details.reason}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logsPagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: logsPagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`page-btn ${page === logsPagination.page ? 'active' : ''}`}
              onClick={() => fetchLogs(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderBlockedIPs = () => (
    <div className="blocked-ips">
      <div className="blocked-header">
        <h2>Blocked IP Addresses</h2>
        <p>Currently blocked IP addresses and their expiration times</p>
      </div>

      <div className="blocked-table">
        <table>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Blocked At</th>
              <th>Expires At</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blockedIPs.map((ip) => (
              <tr key={ip._id}>
                <td className="ip-address">{ip.ipAddress}</td>
                <td>{formatDate(ip.createdAt)}</td>
                <td>{formatDate(ip.blockExpiresAt)}</td>
                <td>{ip.details.blockReason || 'Suspicious activity'}</td>
                <td>
                  <button
                    className="unblock-btn"
                    onClick={() => handleUnblockIP(ip.ipAddress)}
                    disabled={unblockLoading[ip.ipAddress]}
                  >
                    {unblockLoading[ip.ipAddress] ? 'Unblocking...' : 'Unblock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {blockedIPs.length === 0 && (
          <div className="empty-state">
            <p>No IP addresses are currently blocked.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSuspiciousActivity = () => (
    <div className="suspicious-activity">
      <div className="suspicious-header">
        <h2>Real-Time Suspicious Activity</h2>
        <p>IP addresses showing suspicious behavior patterns</p>
      </div>

      <div className="suspicious-grid">
        {suspiciousActivity.map((activity, index) => (
          <div key={index} className="suspicious-card">
            <div className="suspicious-header">
              <h3>IP: {activity.ip}</h3>
              <span className="suspicious-score">Score: {activity.score}</span>
            </div>
            
            <div className="suspicious-details">
              <p><strong>Last Seen:</strong> {formatDate(activity.lastSeen)}</p>
              <p><strong>Request Count:</strong> {activity.requestCount}</p>
              
              <div className="patterns-section">
                <h4>Recent Patterns:</h4>
                <div className="patterns-list">
                  {activity.patterns.slice(-5).map((pattern, idx) => (
                    <div key={idx} className="pattern-item">
                      {pattern.method} {pattern.endpoint}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {suspiciousActivity.length === 0 && (
          <div className="empty-state">
            <p>No suspicious activity detected at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="security-monitor">
      <SideBar />
      <div className="main-content">
        <TopNavbar />
        
        <div className="security-container">
          <div className="security-header">
            <h1>Security Monitor</h1>
           
          </div>

          <div className="security-tabs">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
              onClick={() => setActiveTab('blocked')}
            >
              Blocked IPs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'suspicious' ? 'active' : ''}`}
              onClick={() => setActiveTab('suspicious')}
            >
              Suspicious Activity
            </button>
          </div>

          <div className="security-content">
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading security data...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError('')}>Dismiss</button>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'logs' && renderLogs()}
                {activeTab === 'blocked' && renderBlockedIPs()}
                {activeTab === 'suspicious' && renderSuspiciousActivity()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor; 