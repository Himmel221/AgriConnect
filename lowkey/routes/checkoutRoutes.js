//checkoutRoutes.js 

import express from 'express';
import auth from '../middleware/auth.js';
import { checkoutCart } from '../controllers/cartController.js'; 
import { submitCheckout } from '../controllers/submitCheckout.js'; 
import CheckoutSubmission from '../models/CheckoutSubmission.js';
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

const secureCheckoutUpload = [
  auth,
  uploadRateLimit,
  uploadTimeout(30000), 
  handleUpload(upload.single('proofImage')),
  sanitizeUpload
];

const checkoutSubmitRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many submissions',
    message: 'You can only submit up to 5 checkout proofs per minute. Please wait and try again.',
    code: 'CHECKOUT_SUBMIT_RATE_LIMIT'
  },
  keyGenerator: (req) => req.user ? req.user._id : req.ip
});

const validateCheckoutInput = (req, res, next) => {
  const { bank, referenceNumber, listingId, quantity } = req.body;
  
  // Check for required fields
  if (!bank || !referenceNumber || !listingId || !quantity) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Bank, reference number, listing ID, and quantity are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Validate string lengths
  if (bank.length > 100 || referenceNumber.length > 50) {
    return res.status(400).json({
      error: 'Field too long',
      message: 'Bank name or reference number is too long',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  next();
};

router.post('/submit', checkoutSubmitRateLimit, secureCheckoutUpload, validateCheckoutInput,
  createValidationMiddleware('quantity', 'numeric', { min: 1, max: 10000, allowDecimal: false }),
  createValidationMiddleware('referenceNumber', 'referenceNumber', { minLength: 5, maxLength: 50 }),
  submitCheckout);

router.post('/checkout', auth, checkoutCart);

router.patch('/approve/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid checkout ID',
        message: 'Please provide a valid checkout ID',
        code: 'INVALID_ID'
      });
    }
    
    const checkout = await CheckoutSubmission.findById(id);

    if (!checkout) {
      return res.status(404).json({ 
        error: 'Checkout not found',
        message: 'The requested checkout does not exist',
        code: 'NOT_FOUND'
      });
    }

    const listing = await Listing.findById(checkout.listingId);
    if (!listing || listing.userId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to approve this order.',
        code: 'ACCESS_DENIED'
      });
    }

    checkout.status = 'Accepted'; 
    await checkout.save();

    console.log(`[SECURE_CHECKOUT_APPROVE] User ${req.userId} approved checkout: ${id}`);

    res.status(200).json({ 
      success: true,
      message: 'Order approved successfully.', 
      checkout 
    });
  } catch (error) {
    console.error('[CHECKOUT_APPROVE_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Failed to approve order',
      message: 'An error occurred while approving the order.',
      code: 'APPROVE_ERROR'
    });
  }
});

router.patch('/reject/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid checkout ID',
        message: 'Please provide a valid checkout ID',
        code: 'INVALID_ID'
      });
    }
    
    const checkout = await CheckoutSubmission.findById(id);

    if (!checkout) {
      return res.status(404).json({ 
        error: 'Checkout not found',
        message: 'The requested checkout does not exist',
        code: 'NOT_FOUND'
      });
    }

    const listing = await Listing.findById(checkout.listingId);
    if (!listing || listing.userId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to reject this order.',
        code: 'ACCESS_DENIED'
      });
    }

    checkout.status = 'rejected';
    await checkout.save();

    console.log(`[SECURE_CHECKOUT_REJECT] User ${req.userId} rejected checkout: ${id}`);

    res.status(200).json({ 
      success: true,
      message: 'Order rejected successfully.', 
      checkout 
    });
  } catch (error) {
    console.error('[CHECKOUT_REJECT_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Failed to reject order',
      message: 'An error occurred while rejecting the order.',
      code: 'REJECT_ERROR'
    });
  }
});

export default router;