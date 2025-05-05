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
  const [showAboutUs, setShowAboutUs] = useState(false);

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
        <section className="about-toggle-section">
  <button 
    className="about-toggle-button"
    onClick={() => setShowAboutUs(!showAboutUs)}
  >
    {showAboutUs ? 'About AgriConnect' : 'About AgriConnect'}
    <ArrowRight className={`toggle-icon ${showAboutUs ? 'rotated' : ''}`} />
  </button>
</section>
{showAboutUs && (
  <section className="about-us-section">
    <h2 className="section-title">About AgriConnect</h2>
    <div className="about-content">
      <div className="about-text">
        <h3>Our Mission</h3>
        <p>
          AgriConnect was founded with a simple goal: to bridge the gap between local farmers and consumers. 
          We believe in empowering farmers by giving them direct access to markets while providing consumers 
          with fresh, high-quality produce at fair prices.
        </p>
        
        <h3>What We Do</h3>
        <p>
          AgriConnect is an online marketplace that connects farmers directly with buyers, eliminating unnecessary 
          middlemen. Our platform makes it easy for farmers to showcase their products and for buyers to discover 
          fresh, locally-grown produce.
        </p>
        
        <h3>Our Values</h3>
        <ul className="values-list">
          <li><strong>Sustainability:</strong> Supporting eco-friendly farming practices</li>
          <li><strong>Transparency:</strong> Fair pricing and honest product information</li>
          <li><strong>Community:</strong> Building connections between farmers and consumers</li>
          <li><strong>Quality:</strong> Ensuring only the freshest products reach our customers</li>
        </ul>
      </div>
      
      <div className="developers-section">
        <h3>Meet The Team</h3>
        <div className="developers-grid">
          <div className="developer-card">
            <div className="developer-avatar">
              <img src="https://scontent.fcrk4-2.fna.fbcdn.net/v/t39.30808-6/484147176_1362024438582993_7614207963488889565_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGyXzQpaBnPLSV3AvPgM-QhnfZUg0Aaoymd9lSDQBqjKXJgkifATbGE3DNZK05OPa2XaYGGu8wQU5Pa3A8wf4u_&_nc_ohc=NmB_577appoQ7kNvwGRjddR&_nc_oc=AdmakhlfnzZ6k-lnS31c-8bJ-FRQLf-FV28kClDW8S4PV5lsYh8A7UfOLHlUnuYmI4U&_nc_zt=23&_nc_ht=scontent.fcrk4-2.fna&_nc_gid=xYng7XHTfRm7XnV4jT1HZA&oh=00_AfGZs_4Fi5xEjkHYx2UZV8rANmbqMWBOMmPqoo6Ab0HQbQ&oe=681D22AA" alt="Developer 1" />
            </div>
            <h4>Jeania Radzny Lingat</h4>
            <p className="developer-role">Programmer/Leader</p>
            <p className="developer-desc">Backend/Frontend</p>
          </div>
          
          <div className="developer-card">
            <div className="developer-avatar">
              <img src="https://scontent.fcrk2-1.fna.fbcdn.net/v/t39.30808-6/494374687_3714787765486273_4692203626369849009_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGxYKp36nvmbQg_toYOMogHSUZc62q7LdBJRlzrarst0GpecfVBxKz27_Yt75V_60bk-FytxD8c7Yd8tRjZJDbn&_nc_ohc=0-1LO5cQKu0Q7kNvwGX4pr4&_nc_oc=AdlXqPc6e55B4sPeJl2nnlTrUKYu8hr8JS55taIaW6Gcr8DCpug3A5Skvc_WfYbO11A&_nc_zt=23&_nc_ht=scontent.fcrk2-1.fna&_nc_gid=Z3G-FCRzVJqfaXWzR1T7bg&oh=00_AfHK5dpm7YYlwopXrNzmjKLH3QIZOhZyCyKkrtCfjGyZOA&oe=681D0995" alt="Developer 2" />
            </div>
            <h4>Ronalie Bazar</h4>
            <p className="developer-role">Frontend Developer</p>
            <p className="developer-desc">Documenter</p>
          </div>
          
          <div className="developer-card">
            <div className="developer-avatar">
              <img src="https://cdn.prod.website-files.com/62bdc93e9cccfb43e155104c/654f6a9d977790fb676dddfc_Funny%2520PFP%2520for%2520Tiktok%252012.png" alt="Developer 3" />
            </div>
            <h4>Dyana Rose Bibat</h4>
            <p className="developer-role">Frontend Developer</p>
            <p className="developer-desc">Documenter</p>
          </div>

          <div className="developer-card">
            <div className="developer-avatar">
              <img src="https://scontent.fcrk4-1.fna.fbcdn.net/v/t39.30808-1/460726989_1592648011600823_6584852223229503461_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=106&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeEr42fzDodlc0eLmbd0AvxLEub1E2C_HjwS5vUTYL8ePBMgefw0N3tqrk0SZaMm-b2BHPTI5JG7FqyHmN8lZrI5&_nc_ohc=5lexmi4RX1oQ7kNvwGCucZz&_nc_oc=AdlLLdWvGzhdmNJ2RrEwEGGPVDdX6D6q541sS5oLtNehe-ASgf6gL3YiONT42bHalI4&_nc_zt=24&_nc_ht=scontent.fcrk4-1.fna&_nc_gid=69r284JunRuVBOkxYn2AiA&oh=00_AfH46gjMo_1j_IAAGr8xV_I6UqIaeSj-sLg1tpFkT1WL0Q&oe=681D138F" alt="Developer 4" />
            </div>
            <h4>Al Vincent Bien</h4>
            <p className="developer-role">Frontend Developer</p>
            <p className="developer-desc">Documenter</p>
          </div>
        </div>
      </div>
    </div>
  </section>
)}
        
      </main>
      
      <SignIn open={openSignIn} handleClose={handleCloseSignIn} handleOpenSignUp={handleOpenSignUp} />
      <SignUp open={openSignUp} handleClose={handleCloseSignUp} />
      <Chatbox />
    </div>
  );
};

export default HomePage;