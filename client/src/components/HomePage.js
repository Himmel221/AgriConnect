import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from './top_navbar';
import SignIn from './SignIn';
import SignUp from './SignUp';
import SideBar from './side_bar';
import Chatbox from './Chatbox';
import { ArrowRight, Leaf, Truck, Shield, Star, TrendingUp, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './css/HomePage.css';

const HomePage = () => {
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem('authToken') !== null;

  const handleOpenSignIn = () => setOpenSignIn(true);
  const handleCloseSignIn = () => setOpenSignIn(false);

  const handleOpenSignUp = () => setOpenSignUp(true);
  const handleCloseSignUp = () => setOpenSignUp(false);

  const handleStartShopping = () => {
    if (isLoggedIn) {
      navigate('/buy-area');
    } else {
      handleOpenSignIn();
    }
  };

  const handleBecomeSeller = () => {
    if (isLoggedIn) {
      navigate('/sell-area');
    } else {
      handleOpenSignIn();
    }
  };

  const imageData = [
    {
      id: 1,
      title: "Mango",
      description: "Ripe and sweet Philippine mangoes",
      url: "https://cdn.pixabay.com/photo/2016/07/22/02/58/mango-1534061_1280.jpg",
      imageUrl: "https://cdn.pixabay.com/photo/2016/07/22/02/58/mango-1534061_1280.jpg"
    },
    {
      id: 3,
      title: "Banana",
      description: "Fresh and sweet bananas from local farms",
      url: "https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2018/08/bananas-1354785_1920.jpg",
      imageUrl: "https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2018/08/bananas-1354785_1920.jpg"
    },
    {
      id: 2,
      title: "Strawberry",
      description: "Sweet and juicy strawberries",
      url: "https://cdn.britannica.com/22/75922-050-D3982BD0/flowers-fruits-garden-strawberry-plant-species.jpg",
      imageUrl: "https://cdn.britannica.com/22/75922-050-D3982BD0/flowers-fruits-garden-strawberry-plant-species.jpg"
    },

    {
      id: 4,
      title: "Kalabasa",
      description: "Fresh local squash",
      url: "https://cdn.pixabay.com/photo/2017/07/19/15/23/pumpkin-2519423_1280.jpg",
      imageUrl: "https://cdn.pixabay.com/photo/2017/07/19/15/23/pumpkin-2519423_1280.jpg"
    },
    {
      id: 5,
      title: "Sitaw",
      description: "Fresh string beans",
      url: "https://b2557954.smushcdn.com/2557954/wp-content/uploads/2014/04/20140331_092245_resized.jpg?lossy=0&strip=1&webp=1",
      imageUrl: "https://b2557954.smushcdn.com/2557954/wp-content/uploads/2014/04/20140331_092245_resized.jpg?lossy=0&strip=1&webp=1"
    },
    {
      id: 6,
      title: "Pechay",
      description: "Fresh Chinese cabbage",
      url: "https://greengarden.ph/cdn/shop/products/LINE_ALBUM_PICTURE_230412_98.jpg?v=1681289928",
      imageUrl: "https://greengarden.ph/cdn/shop/products/LINE_ALBUM_PICTURE_230412_98.jpg?v=1681289928"
    },
    {
      id: 7,
      title: "Repolyo",
      description: "Fresh cabbage",
      url: "https://cdn.pixabay.com/photo/2017/04/27/21/01/kohlrabi-2266665_1280.jpg",
      imageUrl: "https://cdn.pixabay.com/photo/2017/04/27/21/01/kohlrabi-2266665_1280.jpg"
    },
    {
      id: 8,
      title: "Talong",
      description: "Fresh eggplants",
      url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjO4LtM9e7yXEeFSWiusCj-EqyRxuJvcrzm238SYnW5CBqAU4ul8d95J-cjxadMKQcSsaxYa2Jgyb-DjR0oqTe-XesnQju0U-QgGQiiMhDslPK_ep8SwPywXi6whSXiePBQtCfp5iqhgFYw/s690/1.+Juan+magsasaka+talong+guide.jpg",
      imageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjO4LtM9e7yXEeFSWiusCj-EqyRxuJvcrzm238SYnW5CBqAU4ul8d95J-cjxadMKQcSsaxYa2Jgyb-DjR0oqTe-XesnQju0U-QgGQiiMhDslPK_ep8SwPywXi6whSXiePBQtCfp5iqhgFYw/s690/1.+Juan+magsasaka+talong+guide.jpg"
    }
  ];

  const categories = [
    { id: 1, name: "Fruits", image: imageData[0].imageUrl },
    { id: 2, name: "Vegetables", image: imageData[3].imageUrl },
    { id: 3, name: "Root Crops", image: imageData[4].imageUrl },
    { id: 4, name: "Leafy Greens", image: imageData[5].imageUrl },
    { id: 5, name: "Gourds", image: imageData[6].imageUrl },
    { id: 6, name: "Seasonal", image: imageData[7].imageUrl }
  ];

  const featuredProducts = [
    { id: 1, name: "Fresh Bananas", price: "₱120.00", seller: "Juan's Farm", image: imageData[0].imageUrl },
    { id: 2, name: "Sweet Strawberries", price: "₱85.00", seller: "Maria's Garden", image: imageData[1].imageUrl },
    { id: 3, name: "Philippine Mangoes", price: "₱65.00/kg", seller: "Mango Farmers Co-op", image: imageData[2].imageUrl },
    { id: 4, name: "Fresh Kabalasa", price: "₱95.00", seller: "Local Farmers", image: imageData[3].imageUrl },
    { id: 5, name: "Fresh Sitaw", price: "₱45.00", seller: "Vegetable Fields", image: imageData[4].imageUrl },
    { id: 6, name: "Fresh Pechay", price: "₱75.00", seller: "Green Garden", image: imageData[5].imageUrl }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setIsTransitioning(true);
        
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % imageData.length);
          setIsTransitioning(false);
        }, 500); 
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const currentImage = imageData[currentIndex];

  return (
    <div className="homepage">
      <TopNavbar handleOpenSignIn={handleOpenSignIn} />
      <SideBar handleOpenSignIn={handleOpenSignIn} />
      
      <main className="main-content">
        {}
        <section className="hero-section">
          <div className="hero-content">
            <h1>Connecting Farmers and Buyers</h1>
            <p>AgriConnect - Your trusted agricultural marketplace for fresh, local produce directly from farmers.</p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={handleStartShopping}>Start Shopping</button>
              <button className="secondary-button" onClick={handleBecomeSeller}>Become a Seller</button>
            </div>
          </div>
        </section>

        {}
        <section className="featured-slider">
          <h2 className="section-title">Featured Products</h2>
          <div 
            className="slider-container"
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div className="slider-track">
              {imageData.map((item, index) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="slider-item-link"
                >
                  <div 
                    className={`slider-item ${index === currentIndex ? 'active' : ''}`}
                    style={{
                      transform: `translateX(-${currentIndex * 100}%)`,
                      opacity: index === currentIndex ? 1 : 0.5,
                      zIndex: index === currentIndex ? 2 : 1
                    }}
                  >
                    <img src={item.imageUrl} alt={item.title} />
                    <div className="slider-content">
                      <h3 className="slider-title">{item.title}</h3>
                      <p className="slider-description">{item.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="slider-nav">
            {imageData.map((_, index) => (
              <div 
                key={index} 
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setIsTransitioning(false);
                  }, 500);
                }}
              />
            ))}
          </div>
        </section>

        {}
        <section className="categories">
          <h2 className="section-title">Browse Categories</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <a 
                key={category.id} 
                href="#" 
                className="category-card"
              >
                <img src={category.image} alt={category.name} />
                <div className="category-overlay">
                  <h3 className="category-name">{category.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>


        {}
        <section className="featured-products">
          <h2 className="section-title">Fresh From Our Farmers</h2>
          <div className="products-grid">
            {featuredProducts.map(product => (
              <a 
                key={product.id} 
                href="#" 
                className="product-card"
              >
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                  <p className="product-seller">by {product.seller}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {}
        <section className="why-choose-us">
          <h2 className="section-title">Why Choose AgriConnect</h2>
          <div className="features-grid">
            <div className="feature-card">
              <Leaf className="feature-icon" />
              <h3>Fresh Produce</h3>
              <p>Direct from local farmers, ensuring the freshest quality for your table.</p>
            </div>
            <div className="feature-card">
              <Truck className="feature-icon" />
              <h3>High Quality, Low Prices</h3>
              <p>Get farm-fresh goods without breaking the bank.</p>
            </div>
            <div className="feature-card">
              <Shield className="feature-icon" />
              <h3>Secure Payments</h3>
              <p>Safe and secure payment options to protect both buyers and sellers.</p>
            </div>
            <div className="feature-card">
              <Star className="feature-icon" />
              <h3>Quality Assured</h3>
              <p>All products meet our quality standards before reaching your hands.</p>
            </div>
          </div>
        </section>

        {}
        <section className="how-it-works">
          <h2 className="section-title">How AgriConnect Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Browse Products</h3>
              <p>Explore our wide range of fresh agricultural products from local farmers.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Place Order</h3>
              <p>Select your items and place your order with our secure checkout system.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Small Fee</h3>
              <p>Minimal fees, maximum value.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Enjoy Freshness</h3>
              <p>Enjoy the taste of fresh, locally-sourced agricultural products.</p>
            </div>
          </div>
        </section>

        {}
        <section className="stats-section">
          <div className="stat-card">
            <h3>10+</h3>
            <p>Active Farmers</p>
          </div>
          <div className="stat-card">
            <h3>20+</h3>
            <p>Happy Customers</p>
          </div>
          <div className="stat-card">
            <h3>100+</h3>
            <p>Products Listed</p>
          </div>
          <div className="stat-card">
            <h3>₱20k+</h3>
            <p>Farmer Earnings</p>
          </div>
        </section>

        {}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Start Your Agricultural Journey?</h2>
            <p>Join thousands of farmers and buyers on AgriConnect today!</p>
            <div className="cta-buttons">
              <button className="primary-button" onClick={handleStartShopping}>Start Shopping</button>
              <button className="secondary-button" onClick={handleBecomeSeller}>Become a Seller</button>
            </div>
          </div>
        </section>
      </main>

     
      
      <SignIn open={openSignIn} handleClose={handleCloseSignIn} handleOpenSignUp={handleOpenSignUp} />
      <SignUp open={openSignUp} handleClose={handleCloseSignUp} />
      <Chatbox />
    </div>
  );
};

export default HomePage;