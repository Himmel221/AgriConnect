import express from 'express';
import auth from '../middleware/auth.js';
import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Listing from '../models/Listing.js'; 

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sellerId = req.userId;
    console.log('Fetching orders for Seller ID:', sellerId);

    const sellerListings = await Listing.find({ userId: sellerId }).select('_id');
    if (!sellerListings.length) {
      console.log('No listings found for seller:', sellerId);
      return res.status(200).json({ orders: [] });
    }

    const listingIds = sellerListings.map(listing => listing._id);
    console.log('Seller Listings:', listingIds);

    const checkoutSubmissions = await CheckoutSubmission.find({
      listingId: { $in: listingIds },
      status: { $in: ['Pending', 'Ongoing', 'Success', 'Rejected', 'Cancelled'] } 
    })
    .populate('userId', 'first_name last_name email')
    .populate('listingId', 'productName quantity unit price userId')
    .lean();

    console.log(`Found ${checkoutSubmissions.length} checkout submissions`);
    console.log(checkoutSubmissions);

    if (!checkoutSubmissions.length) {
      console.log('No matching orders found for seller:', sellerId);
      return res.status(200).json({ orders: [] });
    }

    const formattedOrders = checkoutSubmissions.map(submission => ({
      _id: submission._id,
      buyerName: submission.userId
        ? `${submission.userId.first_name} ${submission.userId.last_name}`
        : 'Unknown',
      buyerEmail: submission.userId?.email || '',
      productName: submission.listingId?.productName || 'Unknown Product',
      quantity: submission.quantity,
      unit: submission.listingId?.unit || '',
      totalPrice: submission.totalPrice,
      status: submission.status,
      buyerStatus: submission.buyerStatus || 'NotYetReceived', 
      approvalNote: submission.approvalNote || '',
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt || null,
    }));

    console.log("Final Orders Sent:", formattedOrders);

    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching seller orders:', error.message);

    res.status(500).json({ 
      message: 'Error fetching seller orders',
      error: error.message,
      stack: error.stack 
    });
  }
});

router.patch('/:orderId/:action', auth, async (req, res) => {
  try {
    const { orderId, action } = req.params;
    const { approvalNote } = req.body;

    if (!['approved', 'rejected'].includes(action.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    const order = await CheckoutSubmission.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = action.toLowerCase() === 'approved' ? 'Ongoing' : 'Rejected'; 
    order.approvalNote = approvalNote || ''; 
    await order.save();

    res.status(200).json({ message: `Order ${action} successfully`, order });
  } catch (error) {
    console.error(`Error updating order status: ${error.message}`);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

export default router;