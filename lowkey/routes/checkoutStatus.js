import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import authMiddleware from '../middleware/auth.js';
import auth from '../middleware/auth.js';
import AuditLogger from '../utils/auditLogger.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.userId;
    if (!['Pending', 'Ongoing', 'Success', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }
    const orders = await Order.find({
      $or: [
        { 'buyer.buyerId': userId },
        { 'seller.sellerId': userId }
      ],
      status: status
    })
      .sort({ orderCreatedAt: -1 })
      .lean();
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, approvalNote } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }
    const oldStatus = order.status;
    order.status = status;
    if (!order.review) order.review = {};
    if (approvalNote) {
      order.review.approvalNote = approvalNote;
    }
    order.review.reviewedBy = req.userId;
    order.review.reviewedAt = new Date();
    await order.save();
    await AuditLogger.logOrderStatusChange(
      order._id.toString(),
      oldStatus,
      status,
      req.userId,
      approvalNote || 'Status changed',
      req
    );
    res.status(200).json({ message: 'Order status updated successfully.', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status.', error: error.message });
  }
});

router.post('/cancel/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order || order.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot cancel non-pending order.' });
    }
    order.status = 'Cancelled';
    await order.save();
    res.status(200).json({ message: 'Order canceled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order.' });
  }
});

export default router;