import express from 'express';
import auth from '../middleware/auth.js';
import { addIdentifier } from '../middleware/list.js';
import Listing from '../models/Listing.js';
import upload from '../middleware/upload.js'; 

const router = express.Router();

// Get listings for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params; 
    console.log(`Fetching listings for User ID: ${userId}`);

    const listings = await Listing.find({ userId, status: true })
      .select('productName category price quantity unit details color listedDate status location minimumOrder imageUrl condition');

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

// Get listings for the currently logged-in user
router.get('/user-listings', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('Fetching user listings for logged-in User ID:', userId);

    const listings = await Listing.find({ userId })
      .select('productName category price quantity unit details color listedDate status location minimumOrder imageUrl condition');

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

// Get all active listings (for BuyArea)
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
      .select('productName category price quantity unit details userId imageUrl listedDate status location minimumOrder condition');

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
      condition: listing.condition // Ensure condition is included
    }));

    console.log('Updated Listings with Seller Information:', updatedListings);

    res.status(200).json({ listings: updatedListings });
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Create a new listing
router.post('/', auth, addIdentifier, upload.single('image'), async (req, res) => {
  try {
    console.log('Incoming POST request to create a listing');
    console.log('Request Body:', req.body); 
    console.log('Uploaded File:', req.file); 

    const { identifier, productName, quantity, unit, category, condition, details, location, price, minimumOrder } = req.body;
    const userId = req.user._id;
    
    if (!req.file || !req.file.path) {
      console.error('Image upload failed or missing');
      return res.status(400).json({ message: 'Image upload is required!' });
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
      condition,
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

    res.status(201).json({ message: 'Listing published!', listing: newListing });

  } catch (error) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
});

// Mark listing as sold
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

// Update a listing
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Incoming PUT request to update a listing. Listing ID:', req.params.id);
    console.log('Incoming Payload:', req.body);

    const { productName, quantity, unit, category, condition, details, location, price, color, minimumOrder } = req.body;
    const { id } = req.params;

    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      console.log('Listing not found. Listing ID:', id);
      return res.status(404).json({ message: 'Listing not found' });
    }

    const imageUrl = req.file ? req.file.path : existingListing.imageUrl; 

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
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
        imageUrl, 
      },
      { new: true }
    );

    console.log('Listing successfully updated:', updatedListing);
    res.status(200).json({ message: 'Listing updated successfully', updatedListing });

  } catch (error) {
    console.error('Error updating listing:', error.message);
    res.status(500).json({ message: 'Error updating listing', error: error.message });
  }
});

// Unlist a product
router.put("/:identifier/unlist", auth, async (req, res) => {
  try {
    const { identifier } = req.params; 
    console.log("Unlisting Product Identifier:", identifier);

    const updatedListing = await Listing.findOneAndUpdate(
      { identifier }, 
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

// Relist a product
router.put("/:identifier/relist", auth, async (req, res) => {
  try {
    const { identifier } = req.params; 
    console.log("Relisting Product Identifier:", identifier);

    const updatedListing = await Listing.findOneAndUpdate(
      { identifier }, 
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

// Delete a listing
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