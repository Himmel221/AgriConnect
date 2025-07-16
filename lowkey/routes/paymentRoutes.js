import express from 'express';
import auth from '../middleware/auth.js';
import PaymentMethod from '../models/PaymentMethod.js';
import rateLimit from 'express-rate-limit';
import { createValidationMiddleware } from '../utils/unifiedValidation.js';
import { relaxedGetRateLimit } from '../middleware/rateLimiter.js';
import AuditLogger from '../utils/auditLogger.js';

const router = express.Router();


const paymentMethodRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    error: 'Too many payment method requests',
    message: 'Please wait before making more payment method requests.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


const imageUploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many image uploads',
    message: 'Please wait before uploading more images.',
    code: 'IMAGE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


const validatePaymentMethodInput = (req, res, next) => {
  const { bankName, accountNumber, accountName, proofImage } = req.body;
  
  
  if (!bankName || !accountNumber || !accountName) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Bank Name, Account Number, and Account Name are required.',
      code: 'MISSING_FIELDS'
    });
  }
  
  
  if (bankName.length > 100) {
    return res.status(400).json({
      error: 'Bank name too long',
      message: 'Bank name must be less than 100 characters.',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  if (accountNumber.length > 50) {
    return res.status(400).json({
      error: 'Account number too long',
      message: 'Account number must be less than 50 characters.',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  if (accountName.length > 100) {
    return res.status(400).json({
      error: 'Account name too long',
      message: 'Account name must be less than 100 characters.',
      code: 'FIELD_TOO_LONG'
    });
  }
  
  
  if (proofImage) {
    
    if (!proofImage.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Invalid image format',
        message: 'Image must be a valid base64 encoded image.',
        code: 'INVALID_IMAGE_FORMAT'
      });
    }
    
    
    const base64Size = Math.ceil((proofImage.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (base64Size > maxSize) {
      return res.status(400).json({
        error: 'Image too large',
        message: 'Image size must be less than 5MB.',
        code: 'IMAGE_TOO_LARGE'
      });
    }
  }
  
  next();
};

router.get('/', auth, relaxedGetRateLimit, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.userId })
      .select("bankName accountNumber accountName proofImage addedAt"); 

    if (!paymentMethods.length) {
      return res.status(404).json({ message: "No payment methods found." });
    }

    res.status(200).json({ message: "Fetched payment methods successfully.", paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res.status(500).json({ message: "Error fetching payment methods.", error: error.message });
  }
});

router.post('/', auth, imageUploadRateLimit, validatePaymentMethodInput, async (req, res) => {
  try {
    console.log('[PAYMENT_METHOD_POST] Request received:', {
      userId: req.userId,
      hasBankName: !!req.body.bankName,
      hasAccountNumber: !!req.body.accountNumber,
      hasAccountName: !!req.body.accountName,
      hasProofImage: !!req.body.proofImage,
      proofImageLength: req.body.proofImage ? req.body.proofImage.length : 0
    });

    const { bankName, accountNumber, accountName, proofImage } = req.body;

          
    const existingMethods = await PaymentMethod.countDocuments({ userId: req.userId });
    if (existingMethods >= 5) {
      return res.status(400).json({
        error: 'Too many payment methods',
        message: 'You can only have up to 5 payment methods.',
        code: 'TOO_MANY_METHODS'
      });
    }

    const newMethod = new PaymentMethod({ 
      userId: req.userId, 
      bankName, 
      accountNumber, 
      accountName, 
      proofImage 
    });
    
    await newMethod.save();

    console.log(`[PAYMENT_METHOD_ADDED] User ${req.userId} added payment method: ${bankName}`);

    res.status(201).json({ 
      message: 'Payment method added successfully.', 
      paymentMethod: newMethod 
    });
  } catch (error) {
    console.error('[PAYMENT_METHOD_ERROR] Error adding payment method:', error.message);
    console.error('[PAYMENT_METHOD_ERROR] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error while adding payment method.', 
      error: error.message 
    });
  }
});


router.put('/:methodId', auth, async (req, res) => {
  try {
    const { methodId } = req.params;
    const { bankName, accountNumber, accountName, proofImage } = req.body; 

    const method = await PaymentMethod.findById(methodId);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    if (method.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only edit your own payment methods.' });
    }

    if (bankName) method.bankName = bankName;
    if (accountNumber) method.accountNumber = accountNumber;
    if (accountName) method.accountName = accountName; 
    if (proofImage) method.proofImage = proofImage;

    await method.save();
    res.status(200).json({ message: 'Payment method updated successfully.', method });

  } catch (error) {
    console.error('Error updating payment method:', error.message);
    res.status(500).json({ message: 'Error updating payment method.', error: error.message });
  }
});

router.delete('/:methodId', auth, async (req, res) => {
  try {
    const { methodId } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';

    const method = await PaymentMethod.findById(methodId);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    if (method.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own payment methods.' });
    }

    // Soft delete the payment method
    method.isDeleted = true;
    method.deletedAt = new Date();
    method.deletedBy = req.userId;
    await method.save();

    // Log the payment method deletion
    await AuditLogger.logPaymentMethodDelete(method._id, method.userId, req.userId, 'Payment method soft deleted by owner', ipAddress);

    res.status(200).json({ message: 'Payment method deleted successfully.' });

  } catch (error) {
    console.error('Error deleting payment method:', error.message);
    res.status(500).json({ message: 'Error deleting payment method.', error: error.message });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params; 

    const paymentMethods = await PaymentMethod.find({ userId }) 
      .select("bankName accountNumber accountName proofImage addedAt");

    if (!paymentMethods.length) {
      return res.status(404).json({ message: "No payment methods found for this user." });
    }

    res.status(200).json({ message: "Fetched payment methods successfully.", paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res.status(500).json({ message: "Error fetching payment methods.", error: error.message });
  }
});

export default router;
