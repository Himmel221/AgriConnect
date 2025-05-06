import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import './css/SellerOrdersArea.css';
import { useAuth } from '../components/AuthProvider';
import axios from 'axios';

const SellerOrdersArea = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Pending'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isVisible: false,
    orderId: null,
    action: '',
    note: '',
  });

  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchSellerOrders = useCallback(async () => {
    try {
      console.log("Fetching orders for status:", status);

      const response = await fetch(`${apiUrl}/api/orders/seller-orders`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      console.log("Raw API Response:", result); 
      
      if (response.ok) {
        console.log('Orders fetched:', result.orders);

        result.orders.forEach(order => console.log("Order Status:", order.status, "Buyer Status:", order.buyerStatus));

        let filteredOrders = [];
        if (status === 'Pending') {
          filteredOrders = (result.orders || []).filter(order =>
            order.status === 'Pending' && (order.BuyerStatus?.trim() === 'NotYetReceived' || !order.BuyerStatus)
          );
        } else if (status === 'Ongoing') {
          filteredOrders = (result.orders || []).filter(order =>
            order.status === 'Ongoing' // ✅ Ensures all Ongoing orders appear here
          );
        } else if (status === 'Success') {
          filteredOrders = (result.orders || []).filter(order =>
            order.status === 'Success'
          );
        } else {
          filteredOrders = (result.orders || []).filter(order =>
            order.status === 'Rejected'
          );
        }

        console.log("Filtered Orders:", filteredOrders);

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

  const openConfirmationModal = (orderId, action) => {
    console.log(`Opening confirmation modal for Order ${orderId} with action: ${action}`);
    
    setConfirmationModal(prev => ({ ...prev, isVisible: true, orderId, action, note: '' }));
  
    setTimeout(() => {
      console.log("Modal State AFTER update:", JSON.stringify(confirmationModal, null, 2)); 
    }, 300); 
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isVisible: false, orderId: null, action: '', note: '' });
  };

  const handleUpdateStatus = async () => {
    const { orderId, action, note } = confirmationModal;
  
    try {
      console.log(`Sending PATCH request to update order ${orderId} with action: ${action}`);
  
      const response = await axios.patch(
        `${apiUrl}/api/orders/${orderId}/${action.toLowerCase()}`, 
        { approvalNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.status === 200) {
        setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId)); 
      }
  
      fetchSellerOrders(); 
      closeConfirmationModal();
    } catch (error) {
      console.error(`Error updating order status:`, error.response?.data || error.message);
      alert(`Failed to update order status: ${error.response?.data?.message || 'An error occurred.'}`);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted':
      case 'Success':
        return 'status-badge approved'; 
      case 'Rejected':
        return 'status-badge rejected'; 
      case 'Ongoing':
        return 'status-badge ongoing'; 
      case 'Cancelled':
        return 'status-badge cancelled'; 
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
            <button onClick={() => setStatus('Pending')} className={status === 'Pending' ? 'active' : ''}>
              Pending Orders
            </button>
            <button onClick={() => setStatus('Ongoing')} className={status === 'Ongoing' ? 'active' : ''}>
              Ongoing Orders
            </button>
            <button onClick={() => setStatus('Success')} className={status === 'Success' ? 'active' : ''}>
              Successful Orders
            </button>
            <button onClick={() => setStatus('Rejected')} className={status === 'Rejected' ? 'active' : ''}>
              Rejected Orders
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
                    <p><strong>Order#:</strong> {order._id}</p>
                    <p><strong>Buyer:</strong> {order.buyerName}</p>
                    <p><strong>Quantity:</strong> {order.quantity} {order.unit}</p>
                    <p><strong>Price:</strong> {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.totalPrice || 0)}</p>
                    <p><strong>Buyer Status:</strong> {order.BuyerStatus ? order.BuyerStatus : "NotYetReceived"}</p>
  
                    {order.proofImage && (
                      <p>
                        <strong>Proof Image:</strong> 
                        <a href={order.proofImage} target="_blank" rel="noopener noreferrer" className="hyperlink">View Image</a>
                      </p>
                    )}
                    
                    {order.status === 'Pending' && (
                      <div className="order-actions">
                        <button onClick={() => openConfirmationModal(order._id, 'Approved')} className="notify-btn">Approve</button>
                        <button onClick={() => openConfirmationModal(order._id, 'Rejected')} className="notify-btn">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-orders">No orders found.</p>
          )}
        </div>
      </div>
  
      {confirmationModal.isVisible ? (
        <div className="mcheckouts-modal-overlay">
          <div className="mcheckouts-modal-content">
            <p>Are you sure you want to {confirmationModal.action === 'Approved' ? 'approve' : 'reject'} this order?</p>
            <textarea 
              value={confirmationModal.note} 
              onChange={(e) => setConfirmationModal((prev) => ({ ...prev, note: e.target.value }))} 
              placeholder="Add a note (optional)..." 
              className="mcheckouts-note-input"
            ></textarea>
            <button onClick={() => {
              console.log(`Confirming action: ${confirmationModal.action} for Order ${confirmationModal.orderId}`);
              handleUpdateStatus();
            }}>
              Confirm
            </button>
            <button onClick={closeConfirmationModal}>Cancel</button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SellerOrdersArea;