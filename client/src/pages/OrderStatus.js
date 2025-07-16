import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/OrderStatus.css';
import { ShoppingCart, Clock, Package, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Pending');
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
      setStatus('Ongoing');  
    } else if (path.includes('successful')) {
      setStatus('Success');
    } else if (path.includes('cancelled')) {
      setStatus('Cancelled');
    }
  }, [location]);

  useEffect(() => {
    const fetchOrdersByStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log(`🚀 Fetching buyer orders with status: ${status}`);

        const response = await axios.get(`${apiUrl}/api/orders/buyer-orders?status=${status}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.orders) {
          setOrders(response.data.orders);
        } else {
          console.log("❌ No orders found in API response.");
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching buyer orders:', error.message);
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
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${apiUrl}/api/orders/buyer-orders/received/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.status === 200) {
        alert('Order marked as received!');
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
      case 'Ongoing':
        return <Package size={24} />;
      case 'Success':
        return <CheckCircle size={24} />;
      case 'Cancelled':
        return <XCircle size={24} />;
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
            <button onClick={() => navigate('/cart')} className={location.pathname === '/cart' ? 'active' : ''}>
              <ShoppingCart size={18} />
              <span>My Cart</span>
            </button>
            <button onClick={() => navigate('/pending')} className={status === 'Pending' ? 'active' : ''}>
              <Clock size={18} />
              <span>Pending</span>
            </button>
            <button onClick={() => navigate('/orders')} className={status === 'Ongoing' ? 'active' : ''}>
              <Package size={18} />
              <span>Orders</span>
            </button>
            <button onClick={() => navigate('/successful')} className={status === 'Success' ? 'active' : ''}>
              <CheckCircle size={18} />
              <span>Successful Orders</span>
            </button>
            <button onClick={() => navigate('/cancelled')} className={status === 'Cancelled' ? 'active' : ''}>
              <XCircle size={18} />
              <span>Cancelled Orders</span>
            </button>
          </div>

          <div className="orderstats-container">
            {loading ? (
              <div className="orderstats-loading">
                <div className="orderstats-loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="orderstats-list">
                {orders
                  .filter(order => status !== 'Ongoing' || order.status === 'Ongoing')
                  .map((order) => (
                    <div key={order._id} className="orderstats-list-item">
                      <div className="orderstats-item-header">
                        <div className="orderstats-item-icon">
                          {getStatusIcon()}
                        </div>
                        <div className="orderstats-item-title">
                          <h3>{order.originalListing?.productName || order.productName || 'Product Name Unavailable'}</h3>
                          <span className="orderstats-item-status">{order.status}</span>
                        </div>
                      </div>
                                <div className="orderstats-detail-row">
            <span className="orderstats-detail-value">{order.originalListing?.identifier || order.orderId || 'N/A'}</span>
          </div>
                      <div className="orderstats-detail-row">
                        <span className="orderstats-detail-label">Seller:</span>
                        <span className="orderstats-detail-value">{order.seller?.sellerName || 'Unknown'}</span>
                      </div>
                      <div className="orderstats-detail-row">
                        <span className="orderstats-detail-label">Quantity:</span>
                        <span className="orderstats-detail-value">{order.orderQuantity} {order.originalListing?.unit}</span>
                      </div>
                      <div className="orderstats-detail-row">
                        <span className="orderstats-detail-label">Total Price:</span>
                        <span className="orderstats-detail-value">₱{order.totalPrice?.toFixed(2) || 'N/A'}</span>
                      </div>
                      {/* Remove BuyerStatus display if value is NotYetReceived or undefined */}
                      {order.buyerStatus && order.buyerStatus !== 'NotYetReceived' && (
                        <div className="orderstats-detail-row">
                          <span className="orderstats-detail-label">Buyer Status:</span>
                          <span className="orderstats-detail-value">{order.buyerStatus}</span>
                        </div>
                      )}
                      {status === 'Ongoing' && order.buyerStatus !== 'Received' && (
                        <div className="orderstats-item-actions">
                          <button onClick={() => handleReceivedOrder(order._id)} className="orderstats-received-btn">
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
    </>
  );
};

export default OrderStatus;