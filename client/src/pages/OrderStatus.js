import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/OrderStatus.css';
import { ShoppingCart, Clock, Package, CheckCircle, ArrowLeft } from 'lucide-react';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('pending')) {
      setStatus('Pending');
    } else if (path.includes('orders')) {
      setStatus('Approved');
    } else if (path.includes('successful')) {
      setStatus('Success');
    }
  }, [location]);

  useEffect(() => {
    const fetchOrdersByStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${apiUrl}/api/checkout-status?status=${status}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200 && response.data.checkouts) {
          setOrders(
            response.data.checkouts.filter((order) => {
              if (status === 'Success') {
                return order.status === 'Success' && order.BuyerStatus === 'Received';
              }
              return order.status === status;
            })
          );
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (status) {
      fetchOrdersByStatus();
    }
  }, [status]);

  const handleReceivedOrder = async (id) => {
    if (!id) {
      alert('No order selected.');
      return;
    }
  
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiUrl}/api/checkout/received/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.status === 200) {
        alert('Order marked as received and balance updated!');
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === id
              ? { ...order, BuyerStatus: 'Received', status: 'Success' }
              : order
          )
        );
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error marking order as received:', error.message);
      alert('Failed to mark order as received.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Pending':
        return <Clock size={24} />;
      case 'Approved':
        return <Package size={24} />;
      case 'Success':
        return <CheckCircle size={24} />;
      default:
        return null;
    }
  };

  return (
    <>
      <TopNavbar />
      <div className="orderstats-page">
        <SideBar />
        <div className="orderstats-main">
          <div className="orderstats-header">
            <h1>{status} Orders</h1>
            <button className="orderstats-back-btn" onClick={() => navigate('/cart')}>
              <ArrowLeft size={18} />
              <span>Back to Cart</span>
            </button>
          </div>

          <div className="orderstats-navigation">
            <button
              onClick={() => navigate('/cart')}
              className={location.pathname === '/cart' ? 'active' : ''}
            >
              <ShoppingCart size={18} />
              <span>My Cart</span>
            </button>
            <button
              onClick={() => navigate('/pending')}
              className={status === 'Pending' ? 'active' : ''}
            >
              <Clock size={18} />
              <span>Pending</span>
            </button>
            <button
              onClick={() => navigate('/orders')}
              className={status === 'Approved' ? 'active' : ''}
            >
              <Package size={18} />
              <span>Orders</span>
            </button>
            <button
              onClick={() => navigate('/successful')}
              className={status === 'Success' ? 'active' : ''}
            >
              <CheckCircle size={18} />
              <span>Successful Orders</span>
            </button>
          </div>

          {status === 'Approved' && (
            <div className="orderstats-info">
              <Package size={20} />
              <p>The seller has been notified about these orders.</p>
            </div>
          )}

          <div className="orderstats-container">
            {loading ? (
              <div className="orderstats-loading">
                <div className="orderstats-loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="orderstats-list">
                {orders.map((order) => (
                  <div key={order._id} className="orderstats-list-item">
                    <div className="orderstats-item-header">
                      <div className="orderstats-item-icon">
                        {getStatusIcon()}
                      </div>
                      <div className="orderstats-item-title">
                        <h3>{order.listingId?.productName || 'Removed Product'}</h3>
                        <span className="orderstats-item-status">{order.status}</span>
                      </div>
                    </div>
                    
                    <div className="orderstats-item-details">
                      <div className="orderstats-detail-row">
                        <span className="orderstats-detail-label">Buyer:</span>
                        <span className="orderstats-detail-value">
                          {`${order.userId.first_name} ${order.userId.last_name}`}
                        </span>
                      </div>
                      <div className="orderstats-detail-row">
                        <span className="orderstats-detail-label">Total Price:</span>
                        <span className="orderstats-detail-value">
                          ₱{order.totalPrice?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {status === 'Approved' && order.BuyerStatus !== 'Received' && (
                      <div className="orderstats-item-actions">
                        <button
                          onClick={() => {
                            setSelectedOrder(order._id);
                            setShowModal(true);
                          }}
                          className="orderstats-received-btn"
                        >
                          Mark as Received
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="orderstats-empty">
                {getStatusIcon()}
                <p>No {status.toLowerCase()} orders found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showModal && (
        <div className="orderstats-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="orderstats-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Receipt</h3>
            <p>This will release the payment to the seller. Do you want to proceed?</p>
            <div className="orderstats-modal-buttons">
              <button
                onClick={() => handleReceivedOrder(selectedOrder)}
                className="orderstats-confirm-btn"
              >
                Confirm
              </button>
              <button onClick={() => setShowModal(false)} className="orderstats-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderStatus;