import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';

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
    const order = await Order.findById(id);
    if (!order || order.buyer.buyerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    order.buyerStatus = 'Received';
    order.status = 'Success';
    await order.save();
    res.status(200).json({ message: 'Order marked as received.', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status.', error: error.message });
  }
});

export default router;