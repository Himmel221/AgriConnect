//checkoutRoutes.js

import express from 'express';
import auth from '../middleware/auth.js';
import { checkoutCart } from '../controllers/cartController.js'; 
import { submitCheckout } from '../controllers/submitCheckout.js'; 
import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Listing from '../models/Listing.js';
import upload from '../middleware/upload.js'; 

const router = express.Router();

router.post('/submit', auth, upload.single('proofImage'), submitCheckout);

router.post('/checkout', auth, checkoutCart);

router.patch('/approve/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const checkout = await CheckoutSubmission.findById(id);

    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found.' });
    }

    const listing = await Listing.findById(checkout.listingId);
    if (!listing || listing.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to approve this order.' });
    }

    checkout.status = 'Accepted'; // Update status to Accepted
    await checkout.save();

    res.status(200).json({ message: 'Order approved successfully.', checkout });
  } catch (error) {
    console.error('Error approving order:', error.message);
    res.status(500).json({ message: 'Failed to approve order.', error: error.message });
  }
});

router.patch('/reject/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const checkout = await CheckoutSubmission.findById(id);

    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found.' });
    }

    const listing = await Listing.findById(checkout.listingId);
    if (!listing || listing.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to reject this order.' });
    }

    checkout.status = 'rejected';
    await checkout.save();

    res.status(200).json({ message: 'Order rejected successfully.', checkout });
  } catch (error) {
    console.error('Error rejecting order:', error.message);
    res.status(500).json({ message: 'Failed to reject order.', error: error.message });
  }
});

export default router;