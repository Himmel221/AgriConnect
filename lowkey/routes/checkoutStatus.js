import express from 'express';
import mongoose from 'mongoose';
import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Listing from '../models/Listing.js';
import authMiddleware from '../middleware/auth.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId); 

    console.log(`Fetching checkouts with status: ${status} for user: ${userId}`);

    if (!['Pending', 'Ongoing', 'Success', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }

    const allCheckouts = await CheckoutSubmission.find().lean();
    console.log("🔍 All Checkout Submissions BEFORE Filtering:", JSON.stringify(allCheckouts, null, 2));

    const checkouts = await CheckoutSubmission.find({
      status: { $eq: status },
      $or: [
        { userId: userId }, 
        { listingId: { $in: await Listing.find({ userId }).distinct('_id') } } 
      ]
    })
    .populate('userId', 'first_name last_name email')
    .populate('listingId', 'productName quantity unit price userId')
    .lean();

    console.log(`Found ${checkouts.length} orders with status: ${status}`);
    console.log("Final checkouts data:", JSON.stringify(checkouts, null, 2));

    res.status(200).json({ orders: checkouts }); 
  } catch (error) {
    console.error('Error fetching orders by status:', error.message);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, approvalNote } = req.body;

    const checkout = await CheckoutSubmission.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found.' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    checkout.status = status;
    if (approvalNote) {
      checkout.approvalNote = approvalNote;
    }

    await checkout.save();
    res.status(200).json({ message: 'Checkout status updated successfully.', checkout });
  } catch (error) {
    console.error('Error updating checkout:', error.message);
    res.status(500).json({ message: 'Failed to update checkout status.', error: error.message });
  }
});

router.post('/cancel/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const checkout = await CheckoutSubmission.findById(id);

    if (!checkout || checkout.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot cancel non-pending checkout.' });
    }

    await CheckoutSubmission.findByIdAndDelete(id);
    res.status(200).json({ message: 'Checkout canceled successfully.' });
  } catch (error) {
    console.error('Error canceling checkout:', error.message);
    res.status(500).json({ message: 'Failed to cancel checkout.' });
  }
});

export default router;