import express from 'express';
import auth from '../middleware/auth.js';
import { addIdentifier } from '../middleware/list.js';
import Listing from '../models/Listing.js';
import upload, { 
  uploadRateLimit, 
  handleUpload, 
  uploadTimeout, 
  sanitizeUpload 
} from '../middleware/upload.js';
import rateLimit from 'express-rate-limit';
import { createValidationMiddleware } from '../utils/unifiedValidation.js';

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
  
  // Check for required fields
  if (!productName || !quantity || !unit || !category || !details || !location || !price) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'All fields are required',
      code: 'MISSING_FIELDS'
    });
  }
  
  // Validate string lengths
  if (productName.length > 100 || details.length > 1000 || location.length > 200) {
    return res.status(400).json({
      error: 'Field too long',
      message: 'One or more fields exceed maximum length',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  next();
};

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params; 
    console.log(`Fetching listings for User ID: ${userId}`);

    const listings = await Listing.find({ userId, status: true })
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
    const userId = req.user._id;

    console.log('Fetching user listings for logged-in User ID:', userId);

    const listings = await Listing.find({ userId })
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
    const userId = req.user._id;
    console.log('Logged-in User ID:', userId);

    const listings = await Listing.find({
      // userId: { $ne: userId },
      status: true, 
      quantity: { $gt: 0 },
    })
      .populate('userId', 'first_name last_name location')
      .select('productName category price quantity unit details userId imageUrl listedDate status location minimumOrder');

    if (!listings || listings.length === 0) {
      console.log('No available listings found.');
      return res.status(200).json({ listings: [] });
    }

    const updatedListings = listings.map((listing) => ({
      ...listing.toObject(),
      seller: `${listing.userId.first_name} ${listing.userId.last_name}`,
      description: listing.details,
      imageUrl: listing.imageUrl || 'default-image.jpg',
      location: listing.location || (listing.userId.address ? listing.userId.address.location : 'Not specified'),

    }));

    console.log('Updated Listings with Seller Information:', updatedListings);

    res.status(200).json({ listings: updatedListings });
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

router.post('/', auth, addIdentifier, createListingRateLimit, secureListingUpload, validateListingInput, 
  createValidationMiddleware('price', 'numeric', { min: 0.01, max: 1000000, allowDecimal: true }),
  createValidationMiddleware('quantity', 'numeric', { min: 1, max: 100000, allowDecimal: false }),
  createValidationMiddleware('minimumOrder', 'numeric', { min: 0, max: 100000, allowDecimal: false, required: false }),
  async (req, res) => {
  try {
    console.log('Incoming POST request to create a listing');
    console.log('Request Body:', req.body); 
    console.log('Uploaded File:', req.file); 

    const { identifier, productName, quantity, unit, category, details, location, price, minimumOrder } = req.body;
    const userId = req.user._id;
    
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

    // Log successful listing creation
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

    // Validate listing ID
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

    if (existingListing.userId.toString() !== req.user._id.toString()) {
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
    
    // Log successful listing update
    console.log(`[SECURE_LISTING_UPDATE] User ${req.user._id} updated listing: ${id}`);
    
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

router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id)

    const deletedListing = await Listing.findByIdAndDelete(id);

    console.log(deletedListing)

    if (!deletedListing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    res.status(200).json({ message: "Listing successfully deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;