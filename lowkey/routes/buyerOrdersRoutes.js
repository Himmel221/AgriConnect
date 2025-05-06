import express from 'express';
import auth from '../middleware/auth.js';
import CheckoutSubmission from '../models/CheckoutSubmission.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const buyerId = req.userId;
    const { status } = req.query;

    console.log(`Fetching orders for Buyer ID: ${buyerId} with status: ${status}`);

    if (!['Pending', 'Ongoing', 'Success', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }

    const buyerOrders = await CheckoutSubmission.find({
      userId: buyerId,
      status: status,
    })
      .populate('listingId', 'productName quantity unit price userId')
      .lean();

    console.log(`Found ${buyerOrders.length} buyer orders with status: ${status}`);

    res.status(200).json({ orders: buyerOrders });
  } catch (error) {
    console.error('Error fetching buyer orders:', error.message);
    res.status(500).json({ message: 'Failed to fetch buyer orders', error: error.message });
  }
});

router.patch('/received/:id', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await CheckoutSubmission.findById(id);
  
      if (!order || order.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Unauthorized action' });
      }
  
      order.BuyerStatus = 'Received';
      order.status = 'Success';
      await order.save();
  
      res.status(200).json({ message: 'Order marked as received.', order });
    } catch (error) {
      console.error('Error marking order as received:', error.message);
      res.status(500).json({ message: 'Failed to update order status.', error: error.message });
    }
  });

export default router;