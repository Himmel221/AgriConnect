import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sellerId = req.userId;
    const orders = await Order.find({ 'seller.sellerId': sellerId })
      .sort({ orderCreatedAt: -1 })
      .lean();
    if (!orders.length) {
      return res.status(200).json({ orders: [] });
    }
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      buyerName: order.buyer?.buyerName || '',
      buyerEmail: order.buyer?.buyerEmail || '',
      productName: order.originalListing?.productName || '',
      quantity: order.orderQuantity,
      unit: order.originalListing?.unit || '',
      totalPrice: order.totalPrice,
      status: order.status,
      buyerStatus: order.buyerStatus,
      approvalNote: order.review?.approvalNote || '',
      submittedAt: order.orderCreatedAt,
      reviewedAt: order.review?.reviewedAt || null,
      proofImage: order.payment?.proofImage || '',
    }));
    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller orders', error: error.message });
  }
});

router.patch('/:orderId/:action', auth, async (req, res) => {
  try {
    const { orderId, action } = req.params;
    const { approvalNote } = req.body;
    if (!['approved', 'rejected'].includes(action.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid action type' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = action.toLowerCase() === 'approved' ? 'Ongoing' : 'Rejected';
    order.review = order.review || {};
    order.review.approvalNote = approvalNote || '';
    order.review.reviewedBy = req.userId;
    order.review.reviewedAt = new Date();
    await order.save();
    res.status(200).json({ message: `Order ${action} successfully`, order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

export default router;