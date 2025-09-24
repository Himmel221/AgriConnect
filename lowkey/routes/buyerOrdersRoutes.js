import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import AuditLogger from '../utils/auditLogger.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const buyerId = req.userId;
    const { status } = req.query;
    if (!['Pending', 'Ongoing', 'Success', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }
    
    const orders = await Order.find({
      'buyer.buyerId': buyerId,
      status: status
    })
      .sort({ orderCreatedAt: -1 })
      .lean();
      
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch buyer orders', error: error.message });
  }
});

router.patch('/received/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';

    // Validate order ID
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

    // Verify buyer ownership
    if (order.buyer.buyerId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to mark this order as received.',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if order is already completed
    if (order.status === 'Success') {
      return res.status(400).json({
        error: 'Order already completed',
        message: 'This order has already been marked as received.',
        code: 'ORDER_ALREADY_COMPLETED'
      });
    }

    // Check if order is in valid state for completion
    if (order.status !== 'Ongoing') {
      return res.status(400).json({
        error: 'Invalid order status',
        message: 'Only ongoing orders can be marked as received.',
        code: 'INVALID_ORDER_STATUS'
      });
    }

    // Update order status
    order.buyerStatus = 'Received';
    order.status = 'Success';
    order.orderCompletedAt = new Date();
    
    // Add to status history
    order.statusHistory.push({
      status: 'Success',
      changedBy: req.userId,
      changedAt: new Date(),
      reason: 'Order marked as received by buyer',
      ipAddress: ipAddress
    });

    await order.save();

    // Increment seller's successful transactions
    try {
      const seller = await User.findById(order.seller.sellerId);
      if (seller && seller.userType === 'seller') {
        await seller.incrementSuccessfulTransaction({
          orderId: order.orderId,
          orderDate: order.orderCreatedAt,
          totalAmount: order.totalPrice,
          buyerName: order.buyer.buyerName,
          productName: order.originalListing.productName,
          quantity: order.orderQuantity,
          unit: order.originalListing.unit
        });

        console.log(`[SUCCESSFUL_TRANSACTION] Seller ${seller.userId} completed transaction ${order.orderId}`);
      }
    } catch (sellerError) {
      console.error('[SELLER_TRANSACTION_ERROR]', sellerError);
      // Don't fail the order completion if seller update fails
    }

    // Log the order completion
    await AuditLogger.logOrderStatusChange(
      order._id.toString(),
      'Ongoing',
      'Success',
      req.userId,
      'Order marked as received by buyer',
      ipAddress
    );

    console.log(`[ORDER_COMPLETED] Order ${order.orderId} marked as received by buyer ${req.userId}`);

    res.status(200).json({ 
      success: true,
      message: 'Order marked as received successfully.', 
      order 
    });
  } catch (error) {
    console.error('[ORDER_RECEIVED_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Failed to update order status',
      message: 'An error occurred while marking the order as received.',
      code: 'UPDATE_ERROR'
    });
  }
});

export default router;