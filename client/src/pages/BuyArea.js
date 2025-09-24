import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import { User } from 'lucide-react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { useAuth } from '../components/AuthProvider';
import Chatbox from '../components/Chatbox';
import NotificationPopup from '../components/NotificationPopup';
import './css/BuyArea.css';
import { useNavigate } from 'react-router-dom';
import { sanitize, validate, inputFilters } from '../utils/unifiedValidation';

const BuyArea = () => {
  const { userId } = useAuth();
  const [listings, setListings] = useState([]);
  const [openBuyModal, setOpenBuyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChatbox, setShowChatbox] = useState(false);
  const [recipientId, setRecipientId] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState({});
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showReceivedPopup, setShowReceivedPopup] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState('');
  const [receivedPopupType, setReceivedPopupType] = useState('success');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  


  const fetchListings = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/listings');

      if (response.status === 200) {
        //console.log('Raw listings from API:', response.data.listings);
        //console.log('Current userId:', userId);
        
        let allListings = response.data.listings.filter((listing) => {
          const listingUserId = listing.userId?._id || listing.userId;
          //console.log('Listing userId:', listingUserId, 'Current userId:', userId);
          const shouldInclude = listingUserId?.toString() !== userId?.toString();
          //console.log('Should include listing:', shouldInclude);
          return shouldInclude; 
        });

        //console.log('Filtered listings:', allListings);
        setListings(allListings);
      } else {
        console.error('Failed to fetch listings:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching listings:', error.message);
    }
  }, [userId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleOpenBuyModal = (listing) => {
    setSelectedProduct(listing);
    setCartQuantity(listing.minimumOrder || 1);
    setOpenBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    setSelectedProduct(null);
    setOpenBuyModal(false);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesProduct = listing.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = listing.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProduct || matchesCategory;
  });

  const handleSearchUpdate = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handleAddToCart = async () => {
    // Prevent adding own listings to cart
    const selectedProductUserId = selectedProduct.userId?._id || selectedProduct.userId;
    if (selectedProductUserId?.toString() === userId?.toString()) {
      setErrorMessage("You cannot add your own listing to the cart.");
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 2000);
      return;
    }

    try {
      const response = await apiClient.post('/api/cart/add', {
        productId: selectedProduct._id,
        quantity: cartQuantity,
      });

      if (response.status === 200) {
        setShowCartSuccess(true);
        handleCloseBuyModal();
        setTimeout(() => {
          setShowCartSuccess(false);
        }, 2000);
      } else {
        console.error('Failed to add to cart:', response.data.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      alert('Failed to add item to cart.');
    }
  };

  const handleRightClick = (e, listing) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedUser(listing.sellerUserId || listing.userId._id || listing.userId); // Prefer pretty userId
    setRecipientName(listing.seller || 'Seller');
    console.log('Recipient ID:', listing.sellerUserId || listing.userId._id || listing.userId);
    console.log('Recipient Name:', listing.seller || 'Seller');
    setShowMenu(true);
  };

  const handleClickOutside = () => {
    setShowMenu(false);
  };

  const handleMenuOptionClick = (option) => {
    if (option === 'profile') {
      if (selectedUser) {
        navigate(`/view-profile/${selectedUser}`);
      }
    } else if (option === 'report') {
      alert(`Reporting ${selectedUser}`);
    } else if (option === 'message') {
      console.log('Opening chat with:', selectedUser, recipientName);
      setRecipientId(selectedUser);
      setRecipientName(recipientName);
      setShowChatbox(true);
    }
    setShowMenu(false);
  };

  const renderSellerSuccessBadge = (successCount) => {
    let badgeClass = "seller-success-badge";
    let badgeText = "";

    if (successCount === 0) {
      badgeClass += " new-seller";
      badgeText = "New Seller";
    } else if (successCount < 5) {
      badgeClass += " beginner-seller";
      badgeText = "New Seller";
    } else if (successCount < 20) {
      badgeClass += " experienced-seller";
      badgeText = "Experienced";
    } else {
      badgeClass += " trusted-seller";
      badgeText = "Trusted Seller";
    }

    return <span className={badgeClass}>{badgeText}</span>;
  };

  const handleReceivedOrder = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiClient.patch(
        `${process.env.REACT_APP_API_URL}/api/orders/buyer-orders/received/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.status === 200) {
        setReceivedMessage('Order marked as received!');
        setReceivedPopupType('success');
        setShowReceivedPopup(true);
        
        // Assuming 'orders' state exists elsewhere or is not needed for this specific update
        // For now, we'll just close the modal as the order is marked as received.
        // If 'orders' state is managed, you would update it here.
        // setOrders((prevOrders) =>
        //   prevOrders.map((order) =>
        //     order._id === id
        //       ? { ...order, BuyerStatus: 'Received', status: 'Success' }
        //       : order
        //   )
        // );
        // setShowModal(false); // Assuming 'showModal' state exists
      }
    } catch (error) {
      console.error('Error marking order as received:', error.message);
      setReceivedMessage('Failed to mark order as received.');
      setReceivedPopupType('error');
      setShowReceivedPopup(true);
    }
  };

  return (
    <>
      <TopNavbar onSearch={setSearchTerm} />
      <main className="main" onClick={handleClickOutside}>
        <SideBar />
        <div className="main-content">
          <div className="listings-container">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing) => (
                <div
                  key={listing._id}
                  className="listing-card"
                  onClick={() => handleOpenBuyModal(listing)}
                >
                  <div className="image-placeholder">
                    <img
                      src={listing.imageUrl ? listing.imageUrl : "default-image.jpg"}
                      alt={listing.productName}
                      className="listing-product-image"
                    />
                  </div>
                  <div className="listing-content">
                    <h3>{listing.productName}</h3>
                    <p>Category: {listing.category}</p>
                    <p>Price: ₱{listing.price}</p>
                    <p>
                      Available Stocks: {listing.quantity} {listing.unit}
                    </p>
                    <p>Location: {listing.location || listing.userId?.address?.location || 'Not specified'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No products available.</p>
            )}
          </div>

          {openBuyModal && selectedProduct && (
            <div className="modal">
              <div className="modal-overlay" onClick={handleCloseBuyModal}></div>
              <div className="modal-content">
                <button className="close-modal-btn" onClick={handleCloseBuyModal}>
                  &times;
                </button>
                <div
                  className="image-placeholder-modal"
                  style={{ backgroundImage: `url(${selectedProduct.imageUrl ? selectedProduct.imageUrl : "default-image.jpg"})` }}
                ></div>
                <div className="product-header">
                  <h2>{selectedProduct.productName}</h2>
                  <User
                    size={30}
                    className="user-icon"
                    onContextMenu={(e) => handleRightClick(e, selectedProduct)}
                  />
                  {showMenu && (
                    <div
                      className="context-menu"
                      style={{
                        top: `${menuPosition.y}px`,
                        left: `${menuPosition.x}px`,
                      }}
                    >
                      <div
                        className="menu-option"
                        onClick={() => handleMenuOptionClick('profile')}
                      >
                        Check Profile
                      </div>
                      <div
                        className="menu-option"
                        onClick={() => handleMenuOptionClick('message')}
                      >
                        Send Message
                      </div>
                      <div
                        className="menu-option"
                        onClick={() => handleMenuOptionClick('report')}
                      >
                        Report
                      </div>
                    </div>
                  )}
                </div>
                <div className="seller-details">
                  {selectedProduct.sellerSuccessfulTransactions !== undefined && selectedProduct.sellerUserType === 'seller' && (
                    <div className="seller-success-info">
                      <span className="successful-transactions">
                        Successful Transactions: {selectedProduct.sellerSuccessfulTransactions}
                      </span>
                      {renderSellerSuccessBadge(selectedProduct.sellerSuccessfulTransactions)}
                    </div>
                  )}
                  <p className="user-info">
                    User: <strong>{selectedProduct.seller || 'Unknown'}</strong>
                  </p>
                </div>
                <p>
                  <strong>Price:</strong> ₱{selectedProduct.price}
                </p>
                <p>
                  <strong>Available Stocks:</strong> {selectedProduct.quantity}{' '}
                  {selectedProduct.unit}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
                <p>
                  <strong>Listed on:</strong> {selectedProduct.listedDate || 'N/A'}
                </p>
                <p><strong>Location:</strong> {selectedProduct.location || selectedProduct.userId?.location || 'Not specified'}</p>

                {selectedProduct.userId !== userId && (
                  <div className="add-to-cart-container">
                    <h3 className="add-to-cart-title">Add to Cart</h3>
                    <p>How many would you like to add to your cart?</p>
                    <div className="quantity-selector">
                      <button
                        onClick={() =>
                          setCartQuantity((prev) =>
                            Math.max(selectedProduct.minimumOrder || 1, prev - 1)
                          )
                        }
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={cartQuantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          const numValue = Number(value);
                          const minQuantity = selectedProduct.minimumOrder || 1;

                          if (numValue < minQuantity) {
                            setCartQuantity(minQuantity);
                          } else if (numValue > selectedProduct.quantity) {
                            setCartQuantity(selectedProduct.quantity);
                          } else {
                            setCartQuantity(numValue);
                          }
                        }}
                        onKeyDown={inputFilters.numeric}
                        className="quantity-input"
                        min={selectedProduct.minimumOrder || 1}
                        max={10000}
                      />
                      <button
                        onClick={() => setCartQuantity((prev) => prev + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="buy-now-btn"
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      {showChatbox && (
        <Chatbox
          recipientId={recipientId}
          recipientName={recipientName}
          onClose={() => setShowChatbox(false)}
        />
      )}
      {showCartSuccess && (
        <div className="cart-success-popup">
          <div className="cart-success-content">
            <span>✓ Item added to cart successfully!</span>
          </div>
        </div>
      )}
      {showErrorPopup && (
        <div className="cart-error-popup">
          <div className="cart-error-content">
            <span>⚠ {errorMessage}</span>
          </div>
        </div>
      )}
      <NotificationPopup
        message={receivedMessage}
        type={receivedPopupType}
        isVisible={showReceivedPopup}
        onClose={() => setShowReceivedPopup(false)}
      />
    </>
  );
};

export default BuyArea; 
