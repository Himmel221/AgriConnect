// CartArea.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import './css/CartArea.css';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, Package, CheckCircle, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { compressImage, validateImageFile } from '../utils/imageUtils';
import { sanitize, validate, inputFilters } from '../utils/unifiedValidation';

const CartArea = () => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [bank, setBank] = useState('');
  const [refNo, setRefNo] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const navigate = useNavigate();
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && Array.isArray(response.data.cartItems)) {
          setCartItems(response.data.cartItems);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  const handleRemoveItem = async (productId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiUrl}/api/cart/remove`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const updatedCart = cartItems.filter(item => item.productId?._id !== productId);
        setCartItems(updatedCart);
        setSelectedItems((prevSelected) => prevSelected.filter((id) => id !== productId));
        if (expandedItem === productId) setExpandedItem(null);
      } else {
        alert('Failed to remove the item. Please try again.');
      }
    } catch (error) {
      alert('Failed to remove the item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    // Validate quantity
    if (newQuantity < 1) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiUrl}/api/cart/update`,
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.productId?._id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    } catch (error) {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.productId?._id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

/*  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("authToken");
  
      // ✅ Send checkout request to backend
      const response = await axios.post(`${apiUrl}/api/checkout/submit`, {
        cartItems,
      }, { headers: { Authorization: `Bearer ${token}` } });
  
      if (response.status === 200) {
        alert("Checkout successful!");
  
        // ✅ Remove purchased items from cart
        setCartItems(prevItems => prevItems.filter(item => !response.data.purchasedItems.includes(item.productId?._id)));
      } else {
        alert("Failed to checkout.");
      }
    } catch (error) {
      console.error("Error during checkout:", error.message);
      alert("Checkout error!");
    }
  };*/

  const handleCheckboxChange = (productId) => {
    setSelectedItems((prevSelected) => {
      const isSelected = prevSelected.includes(productId);
      return isSelected
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId];
    });
  };

  const handleCardClick = (e, productId) => {
    if (
      e.target.closest('.cartarea-checkbox') ||
      e.target.closest('.cartarea-quantity-control') ||
      e.target.closest('.cartarea-remove-btn')
    ) {
      return;
    }
    setExpandedItem(expandedItem === productId ? null : productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      if (selectedItems.includes(item.productId?._id)) {
        const itemTotal = (item.productId?.price || 0) * 1.01 * item.quantity;
        return total + itemTotal;
      }
      return total;
    }, 0);
  };

  const fetchSellerPaymentMethods = async () => {
    try {
      const selectedItem = cartItems.find(item => selectedItems.includes(item.productId?._id));
      if (!selectedItem) {
        console.error("No selected item found");
        return;
      }

      const listingOwnerId = selectedItem.productId?.userId?._id || selectedItem.productId?.userId;
      
      const response = await axios.get(`${apiUrl}/api/payment-methods/${listingOwnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Fetched Payment Methods:", response.data.paymentMethods);
  
      if (response.status === 200) {
        setSellerPaymentMethods(response.data.paymentMethods);
      } else {
        setSellerPaymentMethods([]);
      }
    } catch (error) {
      console.error("Error fetching seller's payment methods:", error.response?.data || error.message);
      setSellerPaymentMethods([]);
    }
  };

  const handleOpenPaymentModal = (sellerId) => {
    fetchSellerPaymentMethods(sellerId); 
    setOpenPaymentModal(true);
  };
  
  const handleClosePaymentModal = () => {
    setOpenPaymentModal(false);
    setBank('');
    setRefNo('');
    setUploadedImage(null);
    setSelectedPaymentMethod(null);
  };
  
  const [checkoutResultModal, setCheckoutResultModal] = useState({ open: false, success: null });

  const handleSavePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setImageError('');
    try {
      const token = localStorage.getItem('authToken');
  
      if (selectedItems.length === 0) {
        handleClosePaymentModal(); 
        setCheckoutResultModal({ open: true, success: false });
        return;
      }
  
      if (!uploadedImage) {
        setImageError('Payment proof image is required.');
        setIsSubmitting(false);
        return;
      }
  
      let successCount = 0;
      let failCount = 0;
      const purchasedItems = [];
  
      for (const listingId of selectedItems) {
        const item = cartItems.find(cartItem => cartItem.productId?._id === listingId);
        if (!item || item.quantity <= 0 || item.productId?.price <= 0) {
          failCount++;
          continue;
        }
  
        const formData = new FormData();
        formData.append('bank', bank);
        formData.append('referenceNumber', refNo);
        formData.append('listingId', listingId);
        formData.append('proofImage', uploadedImage);
        formData.append('quantity', item.quantity);
  
        try {
          const response = await axios.post(`${apiUrl}/api/checkout/submit`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
  
          if (response.status === 201) {
            successCount++;
            purchasedItems.push(listingId);
          }
        } catch (error) {
          failCount++;
        }
      }
  
      if (successCount > 0) {
        setCartItems(prev => prev.filter(item => !purchasedItems.includes(item.productId?._id)));
        setSelectedItems([]);
        handleClosePaymentModal(); 
        setCheckoutResultModal({ open: true, success: true });
  
        setTimeout(() => {
          navigate('/pending'); 
        }, 2000);
      } else {
        handleClosePaymentModal(); 
        setCheckoutResultModal({ open: true, success: false });
      }
    } catch (error) {
      setImageError(error.message || 'Failed to submit payment.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <TopNavbar />
      <main className="cartarea-main">
        <SideBar />
        <div className="cartarea-main-content">
          <div className="cartarea-header">
            <h1>My Shopping Cart</h1>
          </div>

          <div className="cartarea-navigation">
            <Link to="/cart" className="cartarea-nav-link active">
              <ShoppingCart size={18} />
              <span>My Cart</span>
            </Link>
            <Link to="/pending" className="cartarea-nav-link">
              <Clock size={18} />
              <span>Pending</span>
            </Link>
            <Link to="/orders" className="cartarea-nav-link">
              <Package size={18} />
              <span>Orders</span>
            </Link>
            <Link to="/successful" className="cartarea-nav-link">
              <CheckCircle size={18} />
              <span>Successful Orders</span>
            </Link>
          </div>

          <div className="cartarea-container">
            {loading ? (
              <div className="cartarea-loading">
                <div className="cartarea-loading-spinner"></div>
                <p className="cartarea-loading-message">Loading cart items...</p>
              </div>
            ) : cartItems.length > 0 ? (
              <>
                <div className="cartarea-items">
                  {cartItems.map((item) => {
                    const priceWithFee = (item.productId?.price || 0) * 1.01;
                    const isExpanded = expandedItem === item.productId?._id;
                    const isSelected = selectedItems.includes(item.productId?._id);

                    return (
                      <div 
                        key={item.productId?._id || Math.random()} 
                        className={`cartarea-item-card ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => handleCardClick(e, item.productId?._id)}
                      >
                        <div className="cartarea-item-header">
                          <div className="cartarea-item-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(item.productId?._id || null)}
                              className="cartarea-checkbox"
                              disabled={!item.productId}
                            />
                          </div>
                          <div className="cartarea-product-info">
                            <div
                              className="cartarea-product-image"
                              style={{ 
                                backgroundColor: item.productId?.color || '#ccc',
                                backgroundImage: item.productId?.imageUrl ? `url(${item.productId.imageUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            ></div>
                            <div className="cartarea-product-details">
                              <h3>{item.productId ? item.productId.productName : 'Deleted Product'}</h3>
                              <p className="cartarea-product-price">₱{(item.productId?.price?.toFixed(2)) || '0.00'}</p>
                            </div>
                          </div>
                          <div className="cartarea-item-actions">
                            <div className="cartarea-quantity-control">
                              <button
                                className="cartarea-quantity-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.productId?._id, item.quantity - 1);
                                }}
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="cartarea-quantity-value">{item.quantity}</span>
                              <button
                                className="cartarea-quantity-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.productId?._id, item.quantity + 1);
                                }}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.productId?._id);
                              }}
                              className="cartarea-remove-btn"
                              disabled={!item.productId}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="cartarea-expanded-details">
                            <div className="cartarea-detail-row">
                              <span>Product Price:</span>
                              <span>₱{(item.productId?.price?.toFixed(2)) || '0.00'}</span>
                            </div>
                            <div className="cartarea-detail-row">
                              <span>Commission Fee (1%):</span>
                              <span>₱{((item.productId?.price || 0) * 0.01).toFixed(2)}</span>
                            </div>
                            <div className="cartarea-detail-row total">
                              <span>Total Price (with Fee):</span>
                              <span>₱{(priceWithFee * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="cartarea-empty">
                <ShoppingCart size={64} />
                <p className="cartarea-empty-message">Your cart is empty.</p>
                <Link to="/" className="cartarea-shop-link">Continue Shopping</Link>
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="cartarea-summary">
                <div className="cartarea-total">
                  <div className="cartarea-total-row">
                    <span>Total Cart Price:</span>
                    <span className="cartarea-total-amount">₱{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <button
  className="cartarea-checkout-btn"
  disabled={selectedItems.length === 0}
  onClick={() => {
    const firstSelectedItem = cartItems.find(item => selectedItems.includes(item.productId?._id));
    if (firstSelectedItem) {
      handleOpenPaymentModal(firstSelectedItem.productId.userId); 
    }
  }}
>
  <CreditCard size={20} />
  <span>Proceed to Payment</span>
</button>
              </div>
            )}
          </div>
        </div>
        {checkoutResultModal.open && (
  <div className="checkout-result-modal-overlay">
    <div className="checkout-result-modal-content">
      {checkoutResultModal.success ? (
        <>
          <div className="success-animation">✔️</div>
          <h2>Checkout Successful!</h2>
          <p>Your order has been placed successfully.</p>
        </>
      ) : (
        <>
          <div className="error-animation">❌</div>
          <h2>Checkout Failed</h2>
          <p>Something went wrong. Please try again.</p>
        </>
      )}
      <button className="checkout-result-modal-close-btn" onClick={() => setCheckoutResultModal({ open: false })}>
        Close
      </button>
    </div>
  </div>
)}
      </main>

    {openPaymentModal && (
      <div className="cartarea-payment-modal-overlay">
        <div className="cartarea-payment-modal-content">
          <button className="cartarea-payment-modal-close-btn" onClick={handleClosePaymentModal}>
            ✖
          </button>
          <h2>Seller's Payment Details</h2>

          {sellerPaymentMethods.length > 0 ? (
            <div className="cartarea-banking-container">
              <div className="cartarea-bank-select-wrapper">
                <select 
                  className="cartarea-bank-select"
                  onChange={(e) => {
                    const selectedMethod = sellerPaymentMethods.find(
                      method => method._id === e.target.value
                    );
                    if (selectedMethod) {
                      setSelectedPaymentMethod(selectedMethod);
                    }
                  }}
                >
                  <option value="">Select a bank account</option>
                  {sellerPaymentMethods.map((method) => (
                    <option key={method._id} value={method._id}>
                      {method.bankName} - {method.accountName}
                    </option>
                  ))}
                </select>
                <div className="cartarea-select-arrow"></div>
              </div>

              {selectedPaymentMethod && (
                <div className="cartarea-bank-details">
                  <div className="cartarea-account-info">
                    <h3>Account Name</h3>
                    <p>{selectedPaymentMethod.accountName}</p>
                  </div>
                  <div className="cartarea-account-info">
                    <h3>Account Number</h3>
                    <p>{selectedPaymentMethod.accountNumber}</p>
                  </div>
                  {selectedPaymentMethod.proofImage && (
                    <div className="cartarea-proof-container">
                      <h3>Proof of Account</h3>
                      <img 
                        src={selectedPaymentMethod.proofImage} 
                        alt="Bank Proof" 
                        className="cartarea-proof-image"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="cartarea-no-payment-methods">No payment methods found for this seller.</p>
          )}

          <div className="cartarea-payment-submission">
            <h2>Submit Your Payment</h2>
            <div className="cartarea-payment-form">
              <div className="cartarea-form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  placeholder="Enter bank name" 
                  value={bank} 
                  onChange={(e) => setBank(e.target.value)} 
                />
              </div>
              <div className="cartarea-form-group">
                <label>Reference Number</label>
                <input 
                  type="text" 
                  placeholder="Enter reference number" 
                  value={refNo} 
                  onChange={(e) => setRefNo(e.target.value)} 
                />
              </div>
              <div className="cartarea-form-group">
                <label>Payment Proof</label>
                <input 
                  type="file" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    setImageError('');
                    if (!file) return;

                    const validationError = validateImageFile(file, { maxSizeMB: 3 });
                    if (validationError) {
                      setImageError(validationError);
                      setUploadedImage(null);
                      return;
                    }
                      
                    setImageError('Compressing image...');
                    const { file: compressed, error } = await compressImage(file, { maxSizeMB: 3 });
                    if (error) {
                      setImageError(error);
                      setUploadedImage(null);
                      return;
                    }
                    setUploadedImage(compressed);
                    setImageError('');
                  }} 
                  accept="image/*"
                />
                {imageError && <div className="error-message">{imageError}</div>}
              </div>
              <button 
                className="cartarea-submit-payment-btn"
                onClick={handleSavePayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CartArea;  