import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { Tag, Package, Edit2, Truck } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import './css/SellArea.css';
import { useNavigate } from 'react-router-dom';

const SellArea = () => {
  const { isAuthenticated, token, userId } = useAuth();
  const navigate = useNavigate();
  const [openSellModal, setOpenSellModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('sack');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
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
    condition,
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
      formData.append("condition", condition);
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
  
  const handleUnlist = async (listingIdentifier) => {
    try {
      console.log(`Attempting to unlist: /api/listings/${listingIdentifier}/unlist`);
  
      const response = await fetch(`${apiUrl}/api/listings/${listingIdentifier}/unlist`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
  
      console.log("Identifier Passed to Unlist:", listingIdentifier);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unlist the product");
      }
  
      const data = await response.json();
      console.log("Unlist Response Data:", data);
  
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing.identifier === listingIdentifier ? { ...listing, status: false } : listing
        )
      );
    } catch (error) {
      console.error("Error unlisting the product:", error.message);
    }
  };
  
  const handleRelist = async (listingIdentifier) => {
    try {
      console.log(`Attempting to relist: /api/listings/${listingIdentifier}/relist`);
  
      const response = await fetch(`${apiUrl}/api/listings/${listingIdentifier}/relist`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
  
      console.log("Identifier Passed to Relist:", listingIdentifier);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to relist the product");
      }
  
      const data = await response.json();
      console.log("Relist Response Data:", data);
  
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing.identifier === listingIdentifier ? { ...listing, status: true } : listing
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
          condition,
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
    setCondition(listing.condition);
    setDetails(listing.details);
    setLocation(listing.location);
    setPrice(listing.price);
    setColor(listing.color);
    setMinimumOrder(listing.minimumOrder);
    setProductsSold(listing.productsSold);
    setSelectedImage(listing.imageUrl); // 🔹 Make sure the existing image is set
    setOpenSellModal(true);
  
    console.log("Existing Image:", listing.imageUrl); // 🔹 Debugging image display
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
    formData.append("condition", condition);
    formData.append("details", details);
    formData.append("location", location);
    formData.append("price", price);
    formData.append("color", color);
    formData.append("minimumOrder", minimumOrder);
    formData.append("productsSold", productsSold);
    formData.append("userId", userId);
  
    // 🔹 Correctly set image depending on whether a new one is uploaded
    if (selectedImage instanceof File) {
      formData.append("image", selectedImage); // 🔹 Send new image if selected
    } else if (editingListing.imageUrl && !selectedImage) {
      formData.append("existingImageUrl", editingListing.imageUrl); // 🔹 Preserve previous image if no new one
    }
  
    console.log("Form Data Before Sending:", [...formData.entries()]); // 🔹 Debugging
  
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
        setEditingListing(null); // 🔹 Close edit mode
        fetchListings(); // 🔹 Refresh listings
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

  return (
    <>
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

          {}
          {isAuthenticated && (
            <button className="sellarea-start-selling-btn" onClick={handleOpenSellModal}>
              Start Selling!
            </button>
          )}
          <button className="sellarea-check-orders-btn" onClick={handleCheckOrders}>
            Check Orders
          </button>

          <div className="sellarea-item-container">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <div key={listing.identifier} className="sellarea-item-cards">
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
                  <p>Condition: {listing.condition}</p>
                  <p>Location: {listing.location}</p>
                  <p>This listing is {listing.status ? "active" : "inactive"}.</p>

                  <button
                    onClick={() =>
                      listing.status
                        ? handleUnlist(listing.identifier)
                        : handleRelist(listing.identifier)
                    }
                    className={listing.status ? "sellarea-unlist-btn" : "sellarea-list-btn"}
                  >
                    {listing.status ? "Unlist" : "List Again"}
                  </button>

                  <button onClick={() => handleEdit(listing)} className="sellarea-edit-btn">
                    <Edit2 className="sellarea-icon" />
                  </button>

                  {}
                  <button onClick={() => handleDeleteClick(listing._id)} className="delete-btn">
                    Delete
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
                  <input
                    type="text"
                    placeholder="Condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
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

                <button className="sellarea-publish-btn" onClick={editingListing ? handleEditPublish : handlePublish}>
  <Truck className="mr-2" />
  {editingListing ? "Publish Edit" : "Publish"}
</button>
              </div>
            </div>
          )}

          {}
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
  ); };

  export default SellArea;
