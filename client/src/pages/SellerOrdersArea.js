import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import './css/SellerOrdersArea.css';
import { useAuth } from '../components/AuthProvider';
import axios from 'axios';
import { User, ShoppingBag, Tag, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

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
  const [proofModal, setProofModal] = useState({ open: false, image: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 2000);
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
        showNotification(`Order ${action === 'Approved' ? 'approved' : 'rejected'}!`, 'success');
      }
  
      fetchSellerOrders(); 
      closeConfirmationModal();
    } catch (error) {
      console.error(`Error updating order status:`, error.response?.data || error.message);
      showNotification('Failed to update order status.', 'error');
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
                <div key={order._id} className="order-card modern">
                  <div className="order-card-header-row">
                    <div className="order-header">
                      <div className="order-header-title-row">
                        <ShoppingBag size={20} className="order-header-icon" aria-label="Product" />
                        <h3>{order.originalListing?.productName || order.productName || 'Product Name Unavailable'}</h3>
                      </div>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </div>
                    {order.originalListing?.imageUrl ? (
                      <img
                        src={order.originalListing.imageUrl}
                        alt="Product"
                        className="order-product-thumbnail accent-border"
                        aria-label="Product Image"
                      />
                    ) : (
                      <div className="order-product-thumbnail placeholder">
                        <ImageIcon size={32} color="#bbb" />
                      </div>
                    )}
                  </div>
                  <div className="order-divider" />
                  <div className="order-details order-details-rows">
                    <div className="order-detail-row">
                      <span className="order-detail-label"><Tag size={16} className="order-detail-icon" aria-label="Order Identifier" />Order</span>
                      <span className="order-detail-value">{order.originalListing?.identifier || order.orderId || ''}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label"><User size={16} className="order-detail-icon" aria-label="Buyer" />Buyer</span>
                      <span className="order-detail-value">{
                        order.buyer?.buyerName
                          || order.buyerName
                          || (order.userId && (order.userId.first_name || order.userId.last_name)
                            ? `${order.userId.first_name || ''} ${order.userId.last_name || ''}`.trim()
                            : '')
                      }</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label"><ShoppingBag size={16} className="order-detail-icon" aria-label="Quantity" />Quantity</span>
                      <span className="order-detail-value">{
                        (() => {
                          if (order.orderQuantity) {
                            const num = Number(order.orderQuantity);
                            const unit = order.originalListing?.unit || '';
                            return `${num.toLocaleString()}${unit ? ' ' + unit : ''}`;
                          }
                          return 'N/A';
                        })()
                      }</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label"><CheckCircle size={16} className="order-detail-icon" aria-label="Price" />Price</span>
                      <span className="order-detail-value">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.totalPrice || 0)}</span>
                    </div>
                    {order.buyerStatus && order.buyerStatus !== 'NotYetReceived' && (
                      <div className="order-detail-row">
                        <span className="order-detail-label">Buyer Status</span>
                        <span className="order-detail-value">{order.buyerStatus}</span>
                      </div>
                    )}
                    {order.payment?.proofImage && (
                      <div className="order-detail-row">
                        <span className="order-detail-label">Proof</span>
                        <span className="order-detail-value">
                          <button
                            className="view-proof-btn"
                            onClick={() => setProofModal({ open: true, image: order.payment.proofImage })}
                            aria-label="View Proof Image"
                          >
                            <ImageIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> View Proof
                          </button>
                        </span>
                      </div>
                    )}
                    {order.status === 'Pending' && (
                      <div className="order-actions">
                        <button onClick={() => openConfirmationModal(order._id, 'Approved')} className="notify-btn approve-btn" aria-label="Approve Order">
                          <CheckCircle size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Approve
                        </button>
                        <button onClick={() => openConfirmationModal(order._id, 'Rejected')} className="notify-btn reject-btn" aria-label="Reject Order">
                          <XCircle size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Reject
                        </button>
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
      {proofModal.open && (
        <div className="proof-modal-overlay" onClick={() => setProofModal({ open: false, image: '' })}>
          <div className="proof-modal-content" onClick={e => e.stopPropagation()}>
            <img src={proofModal.image} alt="Proof" className="proof-modal-image" />
            <button className="proof-modal-close-btn" onClick={() => setProofModal({ open: false, image: '' })}>Close</button>
          </div>
        </div>
      )}
      {notification.show && (
        <div className={`orderstats-notification-popup ${notification.type}`}>
          <p>{notification.message}</p>
        </div>
      )}
    </>
  );
};

export default SellerOrdersArea;