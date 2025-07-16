import React, { useState, useEffect } from 'react';
import './css/InventoryPage.css';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import { useAuth } from '../components/AuthProvider';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { sanitize, validate, inputFilters } from '../utils/unifiedValidation';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const categories = {
  'Cereal Crops': ['Barley', 'Black Rice', 'Brown Rice', 'Corn', 'Millet', 'Oats', 'Sorghum', 'Wheat', 'White Rice'],
  'Fruits': ['Apples', 'Avocado', 'Bananas', 'Blueberries', 'Cherries', 'Dragon Fruit', 'Grapes', 'Kiwi', 'Lemon', 'Lychee', 'Mangoes', 'Melon', 'Oranges', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Raspberry', 'Strawberries', 'Watermelon'],
  'Legumes': ['Beans', 'Lentils', 'Peas', 'Soybeans'],
  'Vegetables': ['Asparagus', 'Beets', 'Bell Peppers', 'Broccoli', 'Brussels Sprouts', 'Cabbage', 'Carrots', 'Cauliflower', 'Celery', 'Chard', 'Cucumber', 'Eggplant', 'Garlic', 'Green Beans', 'Kale', 'Leeks', 'Lettuce', 'Mushrooms', 'Okra', 'Onions', 'Parsnips', 'Peas', 'Potatoes', 'Pumpkin', 'Radishes', 'Spinach', 'Squash', 'Sweet Corn', 'Sweet Potatoes', 'Tomatoes', 'Turnips', 'Zucchini'],
};

const InventoryPage = () => {
  const { token } = useAuth();

  const [additionalDetails, setAdditionalDetails] = useState({
    batchNumber: '',
    bestClimate: '',
    certificationType: '',
    deliveryOptions: '',
    humidity: '',
    packagingSize: '',
    packagingType: '',
    preferredSoil: '',
    processingMethod: '',
    qrCodeUrl: '',
    storageTemp: '',
    supplierInfo: '',
  });

  const [breakEvenPrices, setBreakEvenPrices] = useState([]);
  
  const [chartData, setChartData] = useState({
    categoryDistribution: null,
    priceComparison: null,
    revenueByProduct: null,
    salesByDate: null,
    salesByStatus: null,
    stockLevels: null
  });

  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    expirationDate: '',
    harvestingDate: '',
    plantingDate: '',
    price: '',
    productName: '',
    quantity: '',
    stockAvailability: '',
    stockThreshold: 10,
    supplyCapacityDaily: '',
    supplyCapacityWeekly: '',
    supplySchedule: 'weekly',
    unit: 'kilograms',
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showOtherDetails, setShowOtherDetails] = useState(false);
  const [successfulOrders, setSuccessfulOrders] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL;


  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryItems(response.data.inventoryItems || []);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error.response ? error.response.data : error.message);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/orders/seller-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.orders) {
        const orders = response.data.orders;
        setSalesData(orders);
        
        const successful = orders.filter(order => order.status === 'Success');
        setSuccessfulOrders(successful);

        setChartData(prevData => ({
          ...prevData,
          revenueByProduct: {
            labels: [...new Set(orders.map(order => order.productName))],
            datasets: [{
              label: 'Revenue by Product',
              data: [...new Set(orders.map(order => order.productName))].map(product => 
                orders
                  .filter(order => order.productName === product)
                  .reduce((sum, order) => sum + order.totalPrice, 0)
              ),
              backgroundColor: '#2196F3',
              borderColor: '#1976D2',
              borderWidth: 1
            }]
          },
          salesByDate: {
            labels: [...new Set(orders.map(order => 
              new Date(order.submittedAt).toLocaleDateString()
            ))],
            datasets: [{
              label: 'Daily Sales',
              data: [...new Set(orders.map(order => 
                new Date(order.submittedAt).toLocaleDateString()
              ))].map(date => 
                orders
                  .filter(order => new Date(order.submittedAt).toLocaleDateString() === date)
                  .reduce((sum, order) => sum + order.totalPrice, 0)
              ),
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true
            }]
          },
          salesByStatus: {
            labels: ['Pending', 'Ongoing', 'Success', 'Rejected'],
            datasets: [{
              label: 'Orders by Status',
              data: [
                orders.filter(order => order.status === 'Pending').length,
                orders.filter(order => order.status === 'Ongoing').length,
                orders.filter(order => order.status === 'Success').length,
                orders.filter(order => order.status === 'Rejected').length
              ],
              backgroundColor: [
                '#FFC107', // Pending - Yellow
                '#2196F3', // Ongoing - Blue
                '#4CAF50', // Success - Green
                '#F44336'  // Rejected - Red
              ],
              borderWidth: 1
            }]
          }
        }));
      }
    } catch (err) {
      console.error('❌ Error fetching sales data:', err);
    }
  };

  const handleAddBreakEvenPrice = () => {
    if (
      breakEvenPrices.length === 0 ||
      (breakEvenPrices.at(-1).price && breakEvenPrices.at(-1).startDate && breakEvenPrices.at(-1).endDate)
    ) {
      setBreakEvenPrices([...breakEvenPrices, { price: '', startDate: '', endDate: '' }]);
    } else {
      alert('Please fill in the previous Break-Even Price before adding another.');
    }
  };

  const handleBreakEvenPriceChange = (index, field, value) => {
    const updated = [...breakEvenPrices];
    updated[index][field] = value;
    setBreakEvenPrices(updated);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedProduct('');
    setFormData(prev => ({ ...prev, category }));
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${apiUrl}/api/inventory/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Product deleted successfully!');
        await fetchInventory();
        await fetchSalesData();
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        alert('Failed to delete product.');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
      harvestingDate: item.harvestingDate ? item.harvestingDate.split('T')[0] : '',
      plantingDate: item.plantingDate ? item.plantingDate.split('T')[0] : '',
      price: item.price,
      productName: item.productName,
      quantity: item.quantity,
      stockAvailability: item.stockAvailability,
      stockThreshold: item.stockThreshold,
      supplyCapacityDaily: item.supplyCapacityDaily,
      supplyCapacityWeekly: item.supplyCapacityWeekly,
      supplySchedule: item.supplySchedule,
      unit: item.unit,
    });
    setAdditionalDetails(item.additionalDetails || {
      batchNumber: '',
      bestClimate: '',
      certificationType: '',
      deliveryOptions: '',
      humidity: '',
      packagingSize: '',
      packagingType: '',
      preferredSoil: '',
      processingMethod: '',
      qrCodeUrl: '',
      storageTemp: '',
      supplierInfo: '',
    });
    setBreakEvenPrices(item.breakEvenPrices || []);
    setSelectedCategory(item.category);
    setSelectedProduct(item.productName);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (additionalDetails.hasOwnProperty(name)) {
      setAdditionalDetails(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductChange = (e) => {
    const product = e.target.value;
    setSelectedProduct(product);
    setFormData(prev => ({ ...prev, productName: product }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.productName || !formData.category) {
      alert('❌ Product Name and Category are required.');
      return;
    }

    if (isNaN(formData.price) || formData.price <= 0) {
      alert('❌ Price must be a positive number.');
      return;
    }

    if (isNaN(formData.quantity) || formData.quantity <= 0) {
      alert('❌ Quantity must be a positive number.');
      return;
    }

    if (isNaN(formData.stockThreshold) || formData.stockThreshold < 0) {
      alert('❌ Stock Threshold must be a non-negative number.');
      return;
    }

    if (isNaN(formData.supplyCapacityDaily) || formData.supplyCapacityDaily < 0) {
      alert('❌ Supply Capacity Daily must be a non-negative number.');
      return;
    }

    if (isNaN(formData.supplyCapacityWeekly) || formData.supplyCapacityWeekly < 0) {
      alert('❌ Supply Capacity Weekly must be a non-negative number.');
      return;
    }

    for (const [index, entry] of breakEvenPrices.entries()) {
      if (!entry.price || isNaN(entry.price) || entry.price <= 0) {
        alert(`❌ Break-Even Price at row ${index + 1} must be a positive number.`);
        return;
      }
      if (!entry.startDate || !entry.endDate) {
        alert(`❌ Start Date and End Date are required for Break-Even Price at row ${index + 1}.`);
        return;
      }
      if (new Date(entry.startDate) > new Date(entry.endDate)) {
        alert(`❌ Start Date cannot be later than End Date for Break-Even Price at row ${index + 1}.`);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        additionalDetails,
        breakEvenPrices,
        userId: localStorage.getItem('userId'),
      };

      payload.quantity = Number(payload.quantity);

      if (editingItem) {
        
        await axios.put(`${apiUrl}/api/inventory/${editingItem._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Product updated successfully!');
      } else {

        await axios.post(`${apiUrl}/api/inventory`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Product added successfully!');
      }

      setIsModalOpen(false);
      resetForm();
      await fetchInventory();
      await fetchSalesData(); 
    } catch (err) {
      console.error('❌ Submission error:', err);
      alert(editingItem ? 'Failed to update product.' : 'Failed to add product.');
    }
  };

  const processChartData = () => {
    const categoryCount = inventoryItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = {
      labels: Object.keys(categoryCount),
      datasets: [{
        data: Object.values(categoryCount),
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FFC107',
          '#9C27B0',
          '#FF5722'
        ],
        borderWidth: 1
      }]
    };

    
    const stockData = {
      labels: inventoryItems.map(item => item.productName),
      datasets: [{
        label: 'Current Stock',
        data: inventoryItems.map(item => item.quantity),
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
        borderWidth: 1
      }]
    };

    const priceData = {
      labels: inventoryItems.map(item => item.productName),
      datasets: [{
        label: 'Price per Unit',
        data: inventoryItems.map(item => item.price),
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1
      }]
    };

    const salesByStatus = {
      labels: ['Pending', 'Ongoing', 'Success', 'Rejected'],
      datasets: [{
        label: 'Orders by Status',
        data: [
          salesData.filter(sale => sale.status === 'Pending').length,
          salesData.filter(sale => sale.status === 'Ongoing').length,
          salesData.filter(sale => sale.status === 'Success').length,
          salesData.filter(sale => sale.status === 'Rejected').length
        ],
        backgroundColor: [
          '#FFC107', 
          '#2196F3', 
          '#4CAF50', 
          '#F44336'  
        ],
        borderWidth: 1
      }]
    };

    
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const salesByDate = {
      labels: last7Days.map(date => new Date(date).toLocaleDateString()),
      datasets: [{
        label: 'Daily Sales',
        data: last7Days.map(date => 
          salesData.filter(sale => 
            new Date(sale.submittedAt).toISOString().split('T')[0] === date
          ).reduce((sum, sale) => sum + sale.totalPrice, 0)
        ),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true
      }]
    };

    
    const revenueByProduct = {
      labels: [...new Set(salesData.map(sale => sale.productName))],
      datasets: [{
        label: 'Revenue by Product',
        data: [...new Set(salesData.map(sale => sale.productName))].map(product => 
          salesData
            .filter(sale => sale.productName === product)
            .reduce((sum, sale) => sum + sale.totalPrice, 0)
        ),
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1
      }]
    };

    setChartData({
      categoryDistribution: categoryData,
      priceComparison: priceData,
      revenueByProduct,
      salesByDate,
      salesByStatus,
      stockLevels: stockData
    });
  };

  const resetForm = () => {
    setFormData({
      category: '',
      expirationDate: '',
      harvestingDate: '',
      plantingDate: '',
      price: '',
      productName: '',
      quantity: '',
      stockAvailability: '',
      stockThreshold: 10,
      supplyCapacityDaily: '',
      supplyCapacityWeekly: '',
      supplySchedule: 'weekly',
      unit: 'kilograms',
    });
    setAdditionalDetails({
      batchNumber: '',
      bestClimate: '',
      certificationType: '',
      deliveryOptions: '',
      humidity: '',
      packagingSize: '',
      packagingType: '',
      preferredSoil: '',
      processingMethod: '',
      qrCodeUrl: '',
      storageTemp: '',
      supplierInfo: '',
    });
    setBreakEvenPrices([]);
    setSelectedCategory('');
    setSelectedProduct('');
    setShowOtherDetails(false);
    setEditingItem(null);
  };

  const toggleOtherDetails = () => setShowOtherDetails(prev => !prev);

  useEffect(() => {
    const fetchData = async () => {
      await fetchInventory();
      await fetchSalesData();
      processChartData();
    };
    fetchData();
  }, [token]);

  return (
    <>
      <TopNavbar />
      <SideBar />
      <div className="inventory-container">
        <button className="inventory-add-product-btn" onClick={() => setIsModalOpen(true)}>Add Product</button>

        {/* Sales Data Section - Moved above graphs */}
        <div className="sales-section">
          <h2 className="sales-title">Inventory Management</h2>
          
          {/* Sales Summary Cards */}
          <div className="sales-summary-cards">
            <div className="summary-card">
              <h3>Total Orders</h3>
              <p>{salesData.length}</p>
            </div>
            <div className="summary-card">
              <h3>Successful Orders</h3>
              <p>{successfulOrders.length}</p>
            </div>
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
                salesData.reduce((sum, order) => sum + (order.status === 'Success' ? order.totalPrice : 0), 0)
              )}</p>
            </div>
          </div>

          {/* Successful Orders Table */}
          <div className="sales-table-container">
            <h3>Successful Orders</h3>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Date</th>
                  <th>Buyer Status</th>
                </tr>
              </thead>
              <tbody>
                {successfulOrders.length > 0 ? (
                  successfulOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.productName}</td>
                      <td>{order.quantity} {order.unit}</td>
                      <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(order.totalPrice)}</td>
                      <td>{new Date(order.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${order.buyerStatus?.toLowerCase() || 'notyetreceived'}`}>
                          {order.buyerStatus || 'NotYetReceived'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5">No successful orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <h1 className="inventory-title"></h1>

        {/* Charts Section */}
        <div className="charts-container">
          <div className="chart-box">
            <h3>Category Distribution</h3>
            {chartData.categoryDistribution && (
              <Pie 
                data={chartData.categoryDistribution}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-box">
            <h3>Stock Levels</h3>
            {chartData.stockLevels && (
              <Bar 
                data={chartData.stockLevels}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-box">
            <h3>Price Comparison</h3>
            {chartData.priceComparison && (
              <Bar 
                data={chartData.priceComparison}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-box">
            <h3>Orders by Status</h3>
            {chartData.salesByStatus && (
              <Pie 
                data={chartData.salesByStatus}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-box">
            <h3>Daily Sales Trend</h3>
            {chartData.salesByDate && (
              <Bar 
                data={chartData.salesByDate}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Revenue (PHP)'
                      }
                    }
                  }
                }}
              />
            )}
          </div>

          <div className="chart-box">
            <h3>Revenue by Product</h3>
            {chartData.revenueByProduct && (
              <Bar 
                data={chartData.revenueByProduct}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Revenue (PHP)'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="inventory-table-container" style={{ overflowX: 'auto' }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Actions</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Stock Threshold</th>
                <th>Supply Capacity Daily</th>
                <th>Supply Capacity Weekly</th>
                <th>Stock Availability</th>
                <th>Packaging Type</th>
                <th>Certification Type</th>
                <th>Packaging Size</th>
                <th>Supplier Info</th>
                <th>Delivery Options</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.length > 0 ? (
                inventoryItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handleEdit(item)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#8A2D3B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#346751',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td>{item.productName}</td>
                    <td>{item.category}</td>
                    <td>{item.price}</td>
                    <td>{item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>{item.stockThreshold}</td>
                    <td>{item.supplyCapacityDaily}</td>
                    <td>{item.supplyCapacityWeekly}</td>
                    <td>{item.stockAvailability}</td>
                    <td>{item.additionalDetails?.packagingType}</td>
                    <td>{item.additionalDetails?.certificationType}</td>
                    <td>{item.additionalDetails?.packagingSize}</td>
                    <td>{item.additionalDetails?.supplierInfo}</td>
                    <td>{item.additionalDetails?.deliveryOptions}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="15">No inventory items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="inventory-modal">
            <div className="inventory-modal-overlay" onClick={() => setIsModalOpen(false)}></div>
            <div className="inventory-modal-content" style={{ overflowY: 'auto', maxHeight: '80vh' }}>
              <h2>{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmit}>
                <label>Category:</label>
                <select name="category" value={selectedCategory} onChange={handleCategoryChange} required>
                  <option value="">Select Category</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {selectedCategory && (
                  <>
                    <label>Product:</label>
                    <select name="productName" value={selectedProduct} onChange={handleProductChange} required>
                      <option value="">Select Product</option>
                      {categories[selectedCategory].map((prod) => (
                        <option key={prod} value={prod}>{prod}</option>
                      ))}
                    </select>
                  </>
                )}

                {Object.keys(formData).map((field) =>
                  field !== 'category' && field !== 'productName' && (
                    <div key={field}>
                      <label>{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type={
                          ['expirationDate', 'plantingDate', 'harvestingDate'].includes(field)
                            ? 'date'
                            : typeof formData[field] === 'number'
                            ? 'number'
                            : 'text'
                        }
                        name={field}
                        value={formData[field]}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          if (typeof formData[name] === 'number') {
                            const cleanValue = value.replace(/[^0-9.]/g, '');
                            if (cleanValue.includes('.') && cleanValue.split('.').length > 2) {
                              return; 
                            }
                            if (additionalDetails.hasOwnProperty(name)) {
                              setAdditionalDetails(prev => ({ ...prev, [name]: cleanValue }));
                            } else {
                              setFormData(prev => ({ ...prev, [name]: cleanValue }));
                            }
                          } else {
                            handleInputChange(e);
                          }
                        }}
                        onKeyDown={
                          typeof formData[field] === 'number' 
                            ? inputFilters.numeric 
                            : undefined
                        }
                      />
                    </div>
                  )
                )}

                <button type="button" onClick={handleAddBreakEvenPrice} className="custom-btn green">Add Break-Even Price</button>

                {breakEvenPrices.map((entry, index) => (
                  <div key={index} className="break-even-field">
                                          <input 
                        type="number" 
                        placeholder="Price" 
                        value={entry.price} 
                        onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        if (value.includes('.') && value.split('.').length > 2) {
                            return; 
                        }
                        handleBreakEvenPriceChange(index, 'price', value);
                      }}
                        onKeyDown={inputFilters.numeric}
                        min="0"
                        max="1000000"
                        step="0.01"
                      />
                    <input type="date" placeholder="Start Date" value={entry.startDate} onChange={(e) => handleBreakEvenPriceChange(index, 'startDate', e.target.value)} />
                    <input type="date" placeholder="End Date" value={entry.endDate} onChange={(e) => handleBreakEvenPriceChange(index, 'endDate', e.target.value)} />
                  </div>
                ))}

                <button type="button" onClick={toggleOtherDetails} className="custom-btn blue">Add Additional Details</button>

                {showOtherDetails && Object.keys(additionalDetails).map((field) => (
                  <div key={field}>
                    <label>{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input type="text" name={field} value={additionalDetails[field]} onChange={handleInputChange} />
                  </div>
                ))}

                <button type="submit" className="inventory-submit-btn">{editingItem ? 'Update' : 'Submit'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryPage;