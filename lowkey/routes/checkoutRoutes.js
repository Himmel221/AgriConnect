//checkoutRoutes.js 

import express from 'express';
import auth from '../middleware/auth.js';
import { checkoutCart } from '../controllers/cartController.js'; 
import { submitCheckout } from '../controllers/submitCheckout.js'; 
import Order from '../models/Order.js';
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
  const { referenceNumber, listingId, quantity } = req.body;
  
  // Check for required fields
  if (!referenceNumber || !listingId || !quantity) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Reference number, listing ID, and quantity are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Validate string lengths
  if (referenceNumber.length > 50) {
    return res.status(400).json({
      error: 'Field too long',
      message: 'Reference number is too long',
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
        error: 'Invalid order ID',
        message: 'Please provide a valid order ID',
        code: 'INVALID_ID'
      });
    }
    
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist',
        code: 'NOT_FOUND'
      });
    }

    if (order.seller.sellerId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to approve this order.',
        code: 'ACCESS_DENIED'
      });
    }

    order.status = 'Ongoing'; 
    order.review = order.review || {};
    order.review.reviewedBy = req.userId;
    order.review.reviewedAt = new Date();
    await order.save();

    console.log(`[SECURE_ORDER_APPROVE] User ${req.userId} approved order: ${id}`);

    res.status(200).json({ 
      success: true,
      message: 'Order approved successfully.', 
      order 
    });
  } catch (error) {
    console.error('[ORDER_APPROVE_ERROR]', error.message);
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
        error: 'Invalid order ID',
        message: 'Please provide a valid order ID',
        code: 'INVALID_ID'
      });
    }
    
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist',
        code: 'NOT_FOUND'
      });
    }

    if (order.seller.sellerId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to reject this order.',
        code: 'ACCESS_DENIED'
      });
    }

    order.status = 'Rejected';
    order.review = order.review || {};
    order.review.reviewedBy = req.userId;
    order.review.reviewedAt = new Date();
    await order.save();

    console.log(`[SECURE_ORDER_REJECT] User ${req.userId} rejected order: ${id}`);

    res.status(200).json({ 
      success: true,
      message: 'Order rejected successfully.', 
      order 
    });
  } catch (error) {
    console.error('[ORDER_REJECT_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Failed to reject order',
      message: 'An error occurred while rejecting the order.',
      code: 'REJECT_ERROR'
    });
  }
});

export default router;