import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { Tag, Package, Edit2, Truck, PlusCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import './css/SellArea.css';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const SellArea = () => {
  const { user, isAuthenticated, token, userId } = useAuth();
  const navigate = useNavigate();
  const [openSellModal, setOpenSellModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('sack');
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('white');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [productsSold, setProductsSold] = useState(0);
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [sellerBalance, setSellerBalance] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [isSeller, setIsSeller] = useState(false); 
  const [showSellerExclusiveModal, setShowSellerExclusiveModal] = useState(false);
  const [showBankingPopup, setShowBankingPopup] = useState(false); 
const [showAddBanking, setShowAddBanking] = useState(false);      
const [sellerPaymentMethods, setSellerPaymentMethods] = useState([]); 
const [bankName, setBankName] = useState("");  
const [accountNumber, setAccountNumber] = useState("");  
const [accountName, setAccountName] = useState("");
const [proofImage, setProofImage] = useState(null);  
const [selectedBankMethod, setSelectedBankMethod] = useState(null);


  console.log("Checking useAuth():", user);
  console.log("SellArea.js -> Extracted isAuthenticated from useAuth():", isAuthenticated);
  
  useEffect(() => {
    if (!user) {
      console.log("User is still loading...");
      return; 
    }
    console.log("User object before setting:", user);
  },   [user]); 



useEffect(() => {
  console.log("SELLAREA Checking isSeller before modal display:", isSeller);

  if (isSeller === null) return; 

  if (!isSeller) {
    console.warn("Access denied: User is not a seller!");
    setShowSellerExclusiveModal(true); 
  } else {
    setShowSellerExclusiveModal(false); 
  }

  console.log("SELLAREA Modal state AFTER update:", showSellerExclusiveModal);
}, [isSeller]);

  const fetchSellerStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/seller-status`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await response.json();
  
      console.log("SELLAREA API RESPONSE:", data); 
  
      if (response.ok) {
        console.log("SELLAREA Extracted isSeller from API:", data.isSeller); 
        setIsSeller(data.isSeller ?? false);
        console.log("SELLAREA State AFTER update:", data.isSeller ?? false); 
      } else {
        console.error("Error fetching seller status:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch seller status:", error);
    }
  };



  useEffect(() => {
    if (token) {
      console.log("SELLAREA Fetching seller status...");
      fetchSellerStatus(); 
    }
  }, [token]);

  const apiUrl = process.env.REACT_APP_API_URL;

  const locations = [
    'San Antonio Norte, Lupao City, Pangasinan',
    'San Antonio Este, Lupao City, Pangasinan',
    'San Antonio Weste, Lupao City, Pangasinan',
    'San Antonio South, Lupao City, Pangasinan',
    'Poblacion, Urdaneta City, Pangasinan',
  ];

  const categories = {
    'Cereal Crops': ['Barley', 'Black Rice', 'Brown Rice', 'Corn', 'Millet', 'Oats', 'Sorghum', 'Wheat', 'White Rice'],
    'Vegetables': ['Asparagus', 'Beets', 'Bell Peppers', 'Broccoli', 'Brussels Sprouts', 'Cabbage', 'Carrots', 'Cauliflower', 'Celery', 'Chard', 'Cucumber', 'Eggplant', 'Garlic', 'Green Beans', 'Kale', 'Leeks', 'Lettuce', 'Mushrooms', 'Okra', 'Onions', 'Parsnips', 'Peas', 'Potatoes', 'Pumpkin', 'Radishes', 'Spinach', 'Squash', 'Sweet Corn', 'Sweet Potatoes', 'Tomatoes', 'Turnips', 'Zucchini'],
    'Fruits': ['Apples', 'Avocado', 'Bananas', 'Blueberries', 'Cherries', 'Dragon Fruit', 'Grapes', 'Kiwi', 'Lemon', 'Lychee', 'Mangoes', 'Melon', 'Oranges', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Raspberry', 'Strawberries', 'Watermelon'],
    'Legumes': ['Beans', 'Lentils', 'Peas', 'Soybeans'],
    'Root Crops': ['Beets', 'Carrots', 'Cassava', 'Ginger', 'Parsnips', 'Potatoes', 'Radishes', 'Sweet Potatoes', 'Turnips', 'Yams'],
    'Tuber Crops': ['Arrowroot', 'Cassava', 'Potatoes', 'Sweet Potatoes', 'Taro', 'Turnips', 'Yams'],
    'Oilseeds': ['Canola', 'Castor', 'Coconut', 'Cottonseed', 'Flaxseed', 'Groundnut', 'Linseed', 'Mustard', 'Palm Kernel', 'Peanut', 'Rapeseed', 'Sesame', 'Soybean', 'Sunflower'],
    'Fiber Crops': ['Cotton', 'Flax', 'Hemp'],
    'Spices': ['Black Pepper', 'Chili', 'Ginger', 'Turmeric'],
    'Forage Crops': ['Alfalfa', 'Clover', 'Ryegrass'],
    'Medicinal Crops': ['Aloe Vera', 'Ginseng', 'Lavender'],
    'Timber/Forestry Crops': ['Bamboo', 'Eucalyptus', 'Oak', 'Pine'],
    'Cover Crops': ['Clover', 'Rye', 'Vetch'],
    'Cash Crops': ['Coffee', 'Sugarcane', 'Tea', 'Tobacco'],
    'Horticultural Crops': ['Flowers', 'Fruits', 'Vegetables'],
    'Seed Crops': ['Canola Seeds', 'Sunflower Seeds', 'Vegetable Seeds'],
  };

  
  const payload = {
    productName,
    quantity,
    unit,
    category,
    details,
    location,
    price,
    color,
    minimumOrder,
    productsSold,
    userId,
  };

  console.log('Payload Sent to Backend:', payload);

  const fetchListings = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/listings/user-listings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log("Fetched listings:", result.listings);
        setListings(result.listings);
      } else {
        console.error('Failed to fetch listings:', result);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  }, [token]); 
  
  useEffect(() => {
    if (token) {
      fetchListings();
    }
  }, [token, fetchListings]); 

  useEffect(() => {
    const fetchSellerBalance = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/withdraw/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.ok) {
          setSellerBalance(result.sellerBalance || 0);
        } else {
          console.error('Failed to fetch seller balance:', result.message);
        }
      } catch (error) {
        console.error('Error fetching seller balance:', error.message);
      }
    };

    if (token) fetchSellerBalance();
  }, [token]);

  const handleOpenSellModal = () => setOpenSellModal(true);
  const handleCloseSellModal = () => setOpenSellModal(false);

  const handleCheckOrders = () => {
    navigate('/seller-orders');
  };

  const handleWithdraw = () => {
    navigate('/withdraw');
  };

  const [identifier, setIdentifier] = useState(""); 
  
  const handlePublish = async () => {
    if (!token || !userId) {
      alert('Token or User ID is missing. Please log in again.');
      return;
    }
  
    if (!productName || !location || !selectedImage) { 
      alert('Product Name, Location, and Image are required.');
      return;
    }

    if (!selectedImage) {
      alert('Image upload is required!');
      return;
    }
  
    try {
      const formData = new FormData(); 
      formData.append("identifier", identifier);
      formData.append("productName", productName);
      formData.append("quantity", quantity);
      formData.append("unit", unit);
      formData.append("category", category);
      formData.append("details", details);
      formData.append("location", location);
      formData.append("price", price);
      formData.append("minimumOrder", minimumOrder);
      formData.append("productsSold", productsSold);
      formData.append("userId", userId);
      formData.append("image", selectedImage); 
      
  
      const response = await fetch(`${apiUrl}/api/listings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: formData, 
      });
  
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed Response:', result);
        throw new Error(result.message || 'Failed to create listing');
      }
  
      alert('Listing published with image!'); 
      handleCloseSellModal();
      fetchListings();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(`Failed to create listing: ${error.message}`);
    }
  };
  
  const handleUnlist = async (listingId) => {
    try {
      if (!listingId) {
        console.error("No ID provided for unlisting");
        return;
      }

      console.log(`Attempting to unlist: /api/listings/${listingId}/unlist`);
  
      const response = await fetch(`${apiUrl}/api/listings/${listingId}/unlist`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
  
      console.log("ID Passed to Unlist:", listingId);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unlist the product");
      }
  
      const data = await response.json();
      console.log("Unlist Response Data:", data);
  
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing._id === listingId ? { ...listing, status: false } : listing
        )
      );
    } catch (error) {
      console.error("Error unlisting the product:", error.message);
    }
  };
  
  const handleRelist = async (listingId) => {
    try {
      if (!listingId) {
        console.error("No ID provided for relisting");
        return;
      }

      console.log(`Attempting to relist: /api/listings/${listingId}/relist`);
  
      const response = await fetch(`${apiUrl}/api/listings/${listingId}/relist`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
  
      console.log("ID Passed to Relist:", listingId);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to relist the product");
      }
  
      const data = await response.json();
      console.log("Relist Response Data:", data);
  
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing._id === listingId ? { ...listing, status: true } : listing
        )
      );
    } catch (error) {
      console.error("Error relisting the product:", error.message);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!token || !userId || !editingListing) {
      alert('Token or User ID is missing, or no listing selected for editing.');
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/api/listings/${editingListing._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          quantity,
          unit,
          category,
          details,
          location,
          price,
          color,
          minimumOrder,
          productsSold,
          userId,
        }),
      });
  
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed Response:', result);
        throw new Error(result.message || 'Failed to update listing');
      }
  
      alert('Listing updated successfully!');
      handleCloseSellModal();
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(`Failed to update listing: ${error.message}`);
    }
  };
  
  const handleEdit = (listing) => {
    console.log("Editing Listing:", listing);
    setEditingListing(listing);
    setProductName(listing.productName);
    setQuantity(listing.quantity);
    setUnit(listing.unit);
    setCategory(listing.category);
    setDetails(listing.details);
    setLocation(listing.location);
    setPrice(listing.price);
    setColor(listing.color);
    setMinimumOrder(listing.minimumOrder);
    setProductsSold(listing.productsSold);
    setSelectedImage(listing.imageUrl); 
    setOpenSellModal(true);
  
    console.log("Existing Image:", listing.imageUrl); 
  };

  const handleEditPublish = async () => {
    if (!token || !userId || !editingListing) {
      alert("Token or User ID is missing, or no listing selected for editing.");
      return;
    }
  
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("quantity", quantity);
    formData.append("unit", unit);
    formData.append("category", category);
    formData.append("details", details);
    formData.append("location", location);
    formData.append("price", price);
    formData.append("color", color);
    formData.append("minimumOrder", minimumOrder);
    formData.append("productsSold", productsSold);
    formData.append("userId", userId);
  
    if (selectedImage instanceof File) {
      formData.append("image", selectedImage); 
    } else if (editingListing.imageUrl && !selectedImage) {
      formData.append("existingImageUrl", editingListing.imageUrl); 
    }
  
    console.log("Form Data Before Sending:", [...formData.entries()]); 
  
    try {
      const response = await fetch(`${apiUrl}/api/listings/${editingListing._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const result = await response.json();
      console.log("Updated Listing Response:", result);
  
      if (response.ok) {
        alert("Listing updated successfully!");
        setEditingListing(null); 
        fetchListings(); 
      } else {
        console.error("Failed to update listing:", result.message);
      }
    } catch (error) {
      console.error("Error updating listing:", error);
    }
  };

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteId, setDeleteId] = useState(null); 
  
  const handleDeleteClick = (id) => {
    setDeleteId(id); 
    setShowConfirmation(true);
  };
  
  const handleCancelDelete = () => {
    setDeleteId(null); 
    setShowConfirmation(false);
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteId) return; 
  
    try {
      const response = await fetch(`${apiUrl}/api/listings/delete/${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed to delete listing:', result.message);
        alert(result.message);
        return;
      }
  
      alert('Listing successfully deleted!');
      fetchListings(); 
      setDeleteId(null); 
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error deleting listing:', error.message);
      alert('Failed to delete the listing.');
    }
  };

  const fetchSellerPaymentMethods = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Fetched Payment Methods:", response.data.paymentMethods); 
  
      if (response.status === 200) {
        setSellerPaymentMethods(response.data.paymentMethods);
      } else {
        setSellerPaymentMethods([]);
      }
    } catch (error) {
      console.error("Error fetching seller's payment methods:", error);
      setSellerPaymentMethods([]);
    }
  };

  useEffect(() => {
    fetchSellerPaymentMethods();
  }, []);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleAddBankingDetails = async () => {
    try {
      const base64Image = proofImage ? await convertToBase64(proofImage) : null;
  
      const response = await fetch(`${apiUrl}/api/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bankName, accountNumber, accountName, proofImage: base64Image }),
      });
  
      if (!response.ok) throw new Error("Failed to add banking details.");
  
      alert("Banking details added successfully!");
    } catch (error) {
      console.error("Error adding banking details:", error);
      alert(error.message);
    }
  };

  if (showSellerExclusiveModal) {
    return (
      <div className="sellarea-sellerExcluModal-overlay">
        <div className="sellarea-SellerExcluModal-content">
          <h2>Seller-Exclusive Access 🚫</h2>
          <p>You are not a verified seller of this platform.</p>
          <button onClick={() => navigate("/")}>Go Back</button> {}
        </div>
      </div>
    );
  }



  return (
    <>
        {showSellerExclusiveModal && (
      <div className="sellarea-sellerExcluModal-overlay">
        <div className="sellarea-sellerExcluModal-content">
          <h2>Seller-Exclusive Access 🚫</h2>
          <p>You are not a verified seller of this platform.</p>
          <button onClick={() => navigate("/")}>Go Back</button>
        </div>
      </div>
    )}
      <TopNavbar />
      <main className="sellarea-main">
        <SideBar />
        <div className="sellarea-main-content">
          <div className="sellarea-balance-section">
            <p>
              <strong>Seller Balance:</strong>{' '}
              {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(sellerBalance)}
            </p>
            <button className="sellarea-withdraw-btn" onClick={handleWithdraw}>
              Withdraw
            </button>
          </div>
          <div className="sellarea-action-buttons">
            {isAuthenticated && (
              <button className="sellarea-start-selling-btn" onClick={handleOpenSellModal}>
                <PlusCircle size={20} />
                Start Selling!
              </button>
            )}
            <button className="sellarea-check-orders-btn" onClick={handleCheckOrders}>
              <Package size={20} />
              Check Orders
            </button>
            <button className="sellarea-banking-details-btn" onClick={() => setShowBankingPopup(true)}>
              <CreditCard size={20} />
              Banking Details
            </button>
          </div>
          {showBankingPopup && (
            <div className="sellarea-banking-popup-overlay">
              <div className="sellarea-banking-popup-content">
                <button className="sellarea-banking-popup-close-btn" onClick={() => setShowBankingPopup(false)}>
                  ✖
                </button>

                {!showAddBanking ? (
                  <>
                    <h2>Seller Banking Details</h2>
                    {sellerPaymentMethods.length > 0 ? (
                      <div className="sellarea-banking-container">
                        <div className="sellarea-bank-select-wrapper">
                          <select 
                            className="sellarea-bank-select"
                            onChange={(e) => {
                              const selectedMethod = sellerPaymentMethods.find(
                                method => method._id === e.target.value
                              );
                              if (selectedMethod) {
                                setSelectedBankMethod(selectedMethod);
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
                          <div className="sellarea-select-arrow"></div>
                        </div>

                        {selectedBankMethod && (
                          <div className="sellarea-bank-details">
                            <div className="sellarea-account-info">
                              <h3>Account Name</h3>
                              <p>{selectedBankMethod.accountName}</p>
                            </div>
                            <div className="sellarea-account-info">
                              <h3>Account Number</h3>
                              <p>{selectedBankMethod.accountNumber}</p>
                            </div>
                            {selectedBankMethod.proofImage && (
                              <div className="sellarea-proof-container has-image">
                                <h3>Proof of Account</h3>
                                <img 
                                  src={selectedBankMethod.proofImage} 
                                  alt="Bank Proof" 
                                  className="sellarea-proof-image"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <button 
                          className="sellarea-add-bank-btn" 
                          onClick={() => setShowAddBanking(true)}
                        >
                          <span className="sellarea-add-icon">+</span>
                          Add New Banking Details
                        </button>
                      </div>
                    ) : (
                      <div className="sellarea-no-payment-method">
                        <p>No banking details added yet.</p>
                        <button 
                          className="sellarea-add-bank-btn" 
                          onClick={() => setShowAddBanking(true)}
                        >
                          Add Banking Details
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="sellarea-banking-header">
                      <h2>Add Banking Details</h2>
                    </div>
                    <div className="sellarea-add-banking-form">
                      <input 
                        type="text" 
                        placeholder="Bank Name" 
                        value={bankName} 
                        onChange={(e) => setBankName(e.target.value)} 
                        className="sellarea-bank-input"
                      />
                      <input 
                        type="text" 
                        placeholder="Account Name" 
                        value={accountName} 
                        onChange={(e) => setAccountName(e.target.value)} 
                        className="sellarea-bank-input"
                      />
                      <input 
                        type="text" 
                        placeholder="Account Number" 
                        value={accountNumber} 
                        onChange={(e) => setAccountNumber(e.target.value)} 
                        className="sellarea-account-input"
                      />
                      <input 
                        type="file" 
                        onChange={(e) => setProofImage(e.target.files[0])} 
                        className="sellarea-upload-proof"
                        accept="image/*"
                      />
                      <div className="sellarea-banking-buttons">
                        <button className="sellarea-cancel-bank-btn" onClick={() => setShowAddBanking(false)}>
                          Cancel
                        </button>
                        <button className="sellarea-save-bank-btn" onClick={handleAddBankingDetails}>
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="sellarea-item-container">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <div key={listing._id} className="sellarea-item-cards">
                  <img
                    src={listing.imageUrl || 'default-image.jpg'}
                    alt={listing.productName}
                    className="sellarea-product-image"
                  />

                  <h3>Product: {listing.productName}</h3>
                  <p>Category: {listing.category}</p>
                  <p>Price: ₱{listing.price}</p>
                  <p>Details: {listing.details}</p>
                  <p>Stocks Availability: {listing.quantity} {listing.unit}</p>
                  <p>Minimum Order: {listing.minimumOrder}</p>
                  <p>Location: {listing.location}</p>
                  <p className={`sellarea-listing-status ${listing.status ? 'active' : 'inactive'}`}>
                    This listing is {listing.status ? "active" : "inactive"}.
                  </p>

                  <button
                    onClick={() =>
                      listing.status
                        ? handleUnlist(listing._id)
                        : handleRelist(listing._id)
                    }
                    className={listing.status ? "sellarea-unlist-btn" : "sellarea-list-btn"}
                  >
                    {listing.status ? "Unlist" : "List Again"}
                  </button>

                  <button onClick={() => handleEdit(listing)} className="sellarea-edit-btn">
                    <Edit2 className="sellarea-icon" />
                  </button>
                </div>
              ))
            ) : (
              <p>You have no listings yet.</p>
            )}
          </div>

          {openSellModal && (
            <div className="sellarea-modal">
              <div className="sellarea-modal-overlay" onClick={handleCloseSellModal}></div>
              <div className="sellarea-modal-contents">
                <h2 className="sellarea-modal-title">
                  {editingListing ? "Edit Listing" : "Create a New Listing"}
                </h2>

                <div className="input-group">
                  <Tag className="icon" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="" disabled>
                      Select a Category
                    </option>
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <Package className="icon" />
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="input-field"
                    disabled={!category}
                  >
                    <option value="" disabled>
                      Select a Product
                    </option>
                    {categories[category]?.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Stocks"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-select"
                  >
                    <option value="sack">Pack</option>
                    <option value="kilograms">Listing</option>
                    <option value="cavan">Bundle</option>
                  </select>
                </div>

                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Minimum Order"
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(e.target.value)}
                    className="input-field"
                  />
                </div>



                <div className="input-group">
                  <textarea
                    placeholder="Details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="input-field h-24"
                  />
                </div>

                <div className="input-group">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field"
                  >
                    <option value="" disabled>
                      Select a Location
                    </option>
                    {locations.map((locationOption, index) => (
                      <option key={index} value={locationOption}>
                        {locationOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="productImage" className="input-label">
                    Upload Product Image
                  </label>
                  <input
                    type="file"
                    id="productImage"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setSelectedImage(file);
                      console.log("Selected file:", file);
                    }}
                    className="input-file"
                    required
                  />
                </div>

                <div className="sellarea-modal-buttons">
                  <button className="sellarea-publish-btn" onClick={editingListing ? handleEditPublish : handlePublish}>
                    <Truck className="mr-2" />
                    {editingListing ? "Publish Edit" : "Publish"}
                  </button>
                  {editingListing && (
                    <button onClick={() => handleDeleteClick(editingListing._id)} className="sellarea-delete-btn">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showConfirmation && (
            <div className="confirmation-popup">
              <p>Are you sure you want to delete this listing?</p>
              <button onClick={handleConfirmDelete}>Yes</button>
              <button onClick={handleCancelDelete}>No</button>
            </div>
          )}
        </div>

      </main>
    </>
  );
};

export default SellArea;