import express from 'express';
import auth from '../middleware/auth.js';
import { addIdentifier } from '../middleware/list.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import upload, { 
  uploadRateLimit, 
  handleUpload, 
  uploadTimeout, 
  sanitizeUpload 
} from '../middleware/upload.js';
import rateLimit from 'express-rate-limit';
import { createValidationMiddleware } from '../utils/unifiedValidation.js';
import PaymentMethod from '../models/PaymentMethod.js';
import cache, { Cache } from '../utils/cache.js';
import AuditLogger from '../utils/auditLogger.js';

const router = express.Router();

const secureListingUpload = [
  auth,
  uploadRateLimit,
  uploadTimeout(30000), 
  handleUpload(upload.single('image')),
  sanitizeUpload
];

const createListingRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many listings created',
    message: 'You can only create up to 5 listings per minute. Please wait and try again.',
    code: 'LISTING_RATE_LIMIT'
  },
  keyGenerator: (req) => req.user ? req.user._id : req.ip
});

const validateListingInput = (req, res, next) => {
  const { productName, quantity, unit, category, details, location, price, minimumOrder } = req.body;
  
  
  if (!productName || !quantity || !unit || !category || !details || !location || !price) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'All fields are required',
      code: 'MISSING_FIELDS'
    });
  }
  
  
  if (productName.length > 100 || details.length > 1000 || location.length > 200) {
    return res.status(400).json({
      error: 'Field too long',
      message: 'One or more fields exceed maximum length',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  next();
};


const checkPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
        message: 'Please login to create listings',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }
    
    const paymentMethods = await PaymentMethod.find({ userId });
    
    if (paymentMethods.length === 0) {
      return res.status(400).json({
        error: 'Payment method required',
        message: 'You must add at least one payment method before creating listings',
        code: 'PAYMENT_METHOD_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking payment methods:', error.message);
    res.status(500).json({ 
      error: 'Error checking payment methods',
      message: 'Failed to verify payment methods',
      code: 'PAYMENT_CHECK_ERROR'
    });
  }
};

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params; 
    console.log(`Fetching listings for User ID: ${userId}`);

    
    const user = await User.findOne({ userId: userId });
    if (!user) {
      console.log(`User not found with userId: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Found user with _id: ${user._id}`);

    
    const listings = await Listing.find({ userId: user._id, status: true, isDeleted: false })
      .select('productName category price quantity unit details color listedDate status location minimumOrder imageUrl');

    if (listings.length === 0) {
      console.log(`No active listings found for User ID: ${userId}`);
      return res.status(200).json({ listings: [] });
    }

    res.status(200).json({ listings });
  } catch (error) {
    console.error('Error fetching listings for user:', error.message);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

router.get('/user-listings', auth, async (req, res) => {
  try {
    const userId = req.userId;

    console.log('Fetching user listings for logged-in User ID:', userId);

    const listings = await Listing.find({ userId, isDeleted: false })
      .select('productName category price quantity unit details color listedDate status location minimumOrder imageUrl');

    if (listings.length === 0) {
      console.log('No listings found for logged-in User ID:', userId);
      return res.status(200).json({ listings: [] });
    }

    res.status(200).json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error.message);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Logged-in User ID:', userId);

    // Generate cache key
    const cacheKey = Cache.generateKey(req);
    console.log('Cache key generated:', cacheKey);
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving listings from cache');
      return res.status(200).json(cachedData);
    }

    console.log('Executing database query for listings...');
    const listings = await Listing.find({
      status: true, 
      quantity: { $gt: 0 },
      isDeleted: false,
    })
      .populate('userId', 'userId first_name last_name location successfulTransactions userType')
      .select('productName category price quantity unit details userId imageUrl listedDate status location minimumOrder')
      .lean();
    console.log('Database query completed. Found', listings.length, 'listings');
    console.log('Raw listings data:', JSON.stringify(listings, null, 2));

    if (!listings || listings.length === 0) {
      console.log('No available listings found.');
      const emptyResponse = { listings: [] };
      cache.set(cacheKey, emptyResponse, 2 * 60 * 1000); // Cache for 2 minutes
      return res.status(200).json(emptyResponse);
    }

    console.log('Mapping listings to response format...');
    const updatedListings = listings.map((listing) => {
      console.log('Processing listing:', listing._id, 'with userId:', listing.userId);
      return {
        ...listing,
        seller: `${listing.userId.first_name} ${listing.userId.last_name}`,
        sellerUserId: listing.userId.userId,
        sellerSuccessfulTransactions: listing.userId.userType === 'seller' ? (listing.userId.successfulTransactions || 0) : 0,
        sellerUserType: listing.userId.userType,
        description: listing.details,
        imageUrl: listing.imageUrl || 'default-image.jpg',
        location: listing.location || (listing.userId.address ? listing.userId.address.location : 'Not specified'),
      };
    });

    console.log('Updated Listings with Seller Information:', updatedListings);

    const response = { listings: updatedListings };
    
    // Cache the response for 5 minutes
    cache.set(cacheKey, response, 5 * 60 * 1000);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

router.post('/', auth, addIdentifier, createListingRateLimit, secureListingUpload, validateListingInput, checkPaymentMethod,
  createValidationMiddleware('price', 'numeric', { min: 0.01, max: 1000000, allowDecimal: true }),
  createValidationMiddleware('quantity', 'numeric', { min: 1, max: 100000, allowDecimal: false }),
  createValidationMiddleware('minimumOrder', 'numeric', { min: 0, max: 100000, allowDecimal: false, required: false }),
  async (req, res) => {
  try {
    console.log('Incoming POST request to create a listing');
    console.log('Request Body:', req.body); 
    console.log('Uploaded File:', req.file); 

    const { identifier, productName, quantity, unit, category, details, location, price, minimumOrder } = req.body;
    const userId = req.userId;
    
    if (!req.file || !req.file.path) {
      console.error('Image upload failed or missing');
      return res.status(400).json({ 
        error: 'Image upload is required',
        message: 'Please provide a valid image file',
        code: 'IMAGE_REQUIRED'
      });
    }

    const imageUrl = req.file.path; 

    console.log('Extracted user ID:', userId);
    console.log('Generated Identifier:', identifier);
    console.log('Uploaded Image URL:', imageUrl);

    const newListing = new Listing({
      identifier: identifier || `${userId}-${Date.now()}`, 
      productName,
      quantity,
      unit,
      category,
      details,
      location,
      price,
      minimumOrder,
      userId,
      imageUrl, 
    });

    console.log('New Listing before save:', newListing);

    await newListing.save();
    console.log('Listing successfully saved:', newListing);

    // Invalidate cache for listings
    cache.clear();

    console.log(`[SECURE_LISTING_CREATE] User ${userId} created listing: ${newListing._id}`);

    res.status(201).json({ 
      success: true,
      message: 'Listing published!', 
      listing: newListing 
    });

  } catch (error) {
    console.error('[LISTING_CREATE_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Error creating listing',
      message: 'Failed to create listing. Please try again.',
      code: 'CREATE_ERROR'
    });
  }
});

router.patch('/mark-as-sold/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Marking listing as sold. Listing ID:', id);

    const listing = await Listing.findById(id);

    if (!listing) {
      console.log('Listing not found. Listing ID:', id);
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = false; 
    await listing.save();

    console.log('Listing successfully marked as sold:', listing);

    res.status(200).json({ message: 'Listing marked as sold', listing });
  } catch (error) {
    console.error('Error marking listing as sold:', error.message);
    res.status(500).json({ message: 'Error marking listing as sold', error: error.message });
  }
});

router.put('/:id', auth, secureListingUpload, validateListingInput, async (req, res) => {
  try {
    console.log('Incoming PUT request to update a listing. Listing ID:', req.params.id);
    console.log('Incoming Payload:', req.body);

    const { productName, quantity, unit, category, details, location, price, color, minimumOrder } = req.body;
    const { id } = req.params;

    
    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid listing ID',
        message: 'Please provide a valid listing ID',
        code: 'INVALID_ID'
      });
    }

    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      console.log('Listing not found. Listing ID:', id);
      return res.status(404).json({ 
        error: 'Listing not found',
        message: 'The requested listing does not exist',
        code: 'NOT_FOUND'
      });
    }

    if (existingListing.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own listings',
        code: 'ACCESS_DENIED'
      });
    }

    const imageUrl = req.file ? req.file.path : existingListing.imageUrl; 

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        productName,
        quantity,
        unit,
        category,
        details,
        location,
        price,
        color,
        minimumOrder,
        imageUrl, 
      },
      { new: true }
    );

    console.log('Listing successfully updated:', updatedListing);
    
    // Invalidate cache for listings
    cache.clear();
    
    console.log(`[SECURE_LISTING_UPDATE] User ${req.userId} updated listing: ${id}`);
    
    res.status(200).json({ 
      success: true,
      message: 'Listing updated successfully', 
      updatedListing 
    });

  } catch (error) {
    console.error('[LISTING_UPDATE_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Error updating listing',
      message: 'Failed to update listing. Please try again.',
      code: 'UPDATE_ERROR'
    });
  }
});

router.put("/:id/unlist", auth, async (req, res) => {
  try {
    const { id } = req.params; 
    console.log("Unlisting Product ID:", id);

    const updatedListing = await Listing.findByIdAndUpdate(
      id, 
      { status: false }, 
      { new: true } 
    );

    if (!updatedListing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    console.log("Listing successfully unlisted:", updatedListing);
    res.status(200).json({ message: "Listing successfully unlisted", listing: updatedListing });
  } catch (error) {
    console.error("Error unlisting product:", error.message);
    res.status(500).json({ message: "Error unlisting product", error: error.message });
  }
});

router.put("/:id/relist", auth, async (req, res) => {
  try {
    const { id } = req.params; 
    console.log("Relisting Product ID:", id);

    const updatedListing = await Listing.findByIdAndUpdate(
      id, 
      { status: true }, 
      { new: true } 
    );

    if (!updatedListing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    console.log("Listing successfully relisted:", updatedListing);
    res.status(200).json({ message: "Listing successfully relisted", listing: updatedListing });
  } catch (error) {
    console.error("Error relisting product:", error.message);
    res.status(500).json({ message: "Error relisting product", error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (listing.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own listings.' });
    }
    listing.isDeleted = true;
    listing.deletedAt = new Date();
    listing.deletedBy = req.userId;
    await listing.save();
    
    // Log the listing deletion
    await AuditLogger.logListingDelete(listing._id, listing.userId, req.userId, 'Listing soft deleted by owner', ipAddress);
    
    res.status(200).json({ message: 'Listing soft-deleted successfully.' });
  } catch (error) {
    console.error('Error soft-deleting listing:', error.message);
    res.status(500).json({ message: 'Error soft-deleting listing.', error: error.message });
  }
});

export default router;