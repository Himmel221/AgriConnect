import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import './css/SellerOrdersArea.css';
import { useAuth } from '../components/AuthProvider';

const SellerOrdersArea = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Pending'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchSellerOrders = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/orders/seller-orders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Orders fetched:', result.orders);
        
        let filteredOrders = [];
        if (status === 'Success') {
          filteredOrders = (result.orders || []).filter(order => 
             order.status === 'Success'
          );
        } else {
          filteredOrders = (result.orders || []).filter(order => 
            order.status === 'Pending' || order.status === 'Rejected' ||  order.status === 'Approved'
          );
        }
        
        setOrders(filteredOrders);
        setError(null);
      } else {
        setOrders([]);
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching seller orders:', error.message);
      setError('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    fetchSellerOrders();
  }, [fetchSellerOrders]);

  const handleNotifyBuyer = (buyerId) => {
    alert(`Notification sent to buyer with ID: ${buyerId}`); 
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
      case 'Success':
        return 'status-badge approved';
      case 'Rejected':
        return 'status-badge rejected';
      case 'Pending':
      default:
        return 'status-badge pending';
    }
  };

  return (
    <>
      <TopNavbar />
      <div className="seller-orders-area-page">
        <SideBar />
        <div className="seller-orders-main">
          <h1>Seller Orders</h1>
          <div className="seller-orders-navigation">
            <button
              onClick={() => setStatus('Pending')}
              className={status === 'Pending' ? 'active' : ''}
            >
              Pending Orders
            </button>
            <button
              onClick={() => setStatus('Success')}
              className={status === 'Success' ? 'active' : ''}
            >
              Successful Orders
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length > 0 ? (
            <div className="seller-orders-container">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <h3>{order.productName}</h3>
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <p>
                      <strong>Buyer:</strong> {order.buyerName}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {order.quantity} {order.unit}
                    </p>
                    <p>
                      <strong>Price:</strong> {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.totalPrice || 0)}
                    </p>
                    <p>
                      <strong>Buyer Status:</strong> {order.buyerStatus === 'NotYetReceived' ? 'Not Yet Received' : 'Received'}
                    </p>
                    
                    {order.approvalNote && (
                      <p className="approval-note">
                        <strong>Note:</strong> {order.approvalNote}
                      </p>
                    )}
                    
                    {order.reviewedAt && (
                      <p className="reviewed-date">
                        <strong>Reviewed:</strong> {new Date(order.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    
                    {order.submittedAt && (
                      <p className="submitted-date">
                        <strong>Submitted:</strong> {new Date(order.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  {status === 'Pending' && order.buyerStatus === 'NotYetReceived' && (
                    <div className="order-actions">
                      <button
                        onClick={() => handleNotifyBuyer(order.buyerId || order.buyerEmail)}
                        className="notify-btn"
                      >
                        Notify Buyer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-orders">No orders found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SellerOrdersArea;