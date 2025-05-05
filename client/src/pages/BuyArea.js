import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User } from 'lucide-react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { useAuth } from '../components/AuthProvider';
import Chatbox from '../components/Chatbox';
import './css/BuyArea.css';
import { useNavigate } from 'react-router-dom';

const BuyArea = () => {
  const { token, userId } = useAuth();
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const apiUrl = process.env.REACT_APP_API_URL;


  const fetchListings = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        let allListings

        // eto if di dapat makita yung nilist ni seller
        /* allListings = response.data.listings.filter((listing) => {
          return listing.userId !== userId; 
        });
        */

        // eto naman if need makita yung nilist ni seller sa buy are
        allListings = response.data?.listings

        console.log(allListings)

        setListings(allListings);
      } else {
        console.error('Failed to fetch listings:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching listings:', error.message);
    }
  }, [token, userId]);

  useEffect(() => {
    if (token) {
      fetchListings();
    }
  }, [token, fetchListings]);

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
    try {
      const response = await axios.post(
        `${apiUrl}/api/cart/add`,
        {
          productId: selectedProduct._id,
          quantity: cartQuantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        alert('Item added to cart successfully!');
        handleCloseBuyModal();
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
    setSelectedUser(listing.userId._id || listing.userId); 
    setRecipientName(listing.seller || 'Seller'); 
    console.log('Recipient ID:', listing.userId._id || listing.userId); 
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
      badgeText = "Beginner";
    } else if (successCount < 20) {
      badgeClass += " experienced-seller";
      badgeText = "Experienced";
    } else {
      badgeClass += " trusted-seller";
      badgeText = "Trusted Seller";
    }
    
    return <span className={badgeClass}>{badgeText}</span>;
  };
  return (
    <>
      <TopNavbar onSearch={setSearchTerm} /> {}
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
                    <div className="seller-info">

                      {listing.sellerSuccessCount !== undefined && (
                        renderSellerSuccessBadge(listing.sellerSuccessCount)
                      )}
                    </div>
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
                  <p className="user-info">
                    User: <strong>{selectedProduct.seller || 'Unknown'}</strong>
                  </p>
                  {selectedProduct.sellerSuccessCount !== undefined && (
                    <div className="seller-success-info">
                      {renderSellerSuccessBadge(selectedProduct.sellerSuccessCount)}
                      <span className="success-transactions">
                        ({selectedProduct.sellerSuccessCount} successful transactions)
                      </span>
                    </div>
                  )}
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
                        onChange={(e) =>
                          setCartQuantity(
                            Math.max(
                              selectedProduct.minimumOrder || 1,
                              Number(e.target.value)
                            )
                          )
                        }
                        className="quantity-input"
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
          senderId={userId} 
          recipientId={recipientId} 
          recipientName={recipientName}
          onClose={() => setShowChatbox(false)}
        />
      )}
    </>
  );
};

export default BuyArea;