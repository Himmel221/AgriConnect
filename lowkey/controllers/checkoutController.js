//checkoutController.js

import Cart from '../models/Cart.js';
import UserBalance from '../models/UserBalance.js';
import Listing from '../models/Listing.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Order from '../models/Order.js';

export const submitCheckout = async (req, res) => {
  try {
    const { referenceNumber, listingId, quantity } = req.body;
    const proofImage = req.file?.path;

    if (!proofImage) {
      return res.status(400).json({ message: 'Proof image is required.' });
    }

    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required.' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required.' });
    }


    const listing = await Listing.findOneAndUpdate(
      {
        _id: listingId,
              status: true,
        quantity: { $gte: quantity }
      },
      {
        $inc: { quantity: -quantity }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!listing) {
      return res.status(400).json({
        message: 'Listing not found, inactive, or insufficient quantity available.',
        code: 'INSUFFICIENT_STOCK'
      });
    }

    const sellerId = listing.userId;

    // Check if seller has payment methods
    const sellerPaymentMethods = await PaymentMethod.find({ userId: sellerId });
    if (sellerPaymentMethods.length === 0) {
      // Restore the quantity since we're rejecting the checkout
      await Listing.findByIdAndUpdate(listingId, { $inc: { quantity: quantity } });
      return res.status(400).json({
        error: 'Seller has no payment methods',
        message: 'No payment methods found for this seller. Ask the seller first to add one.',
        code: 'SELLER_NO_PAYMENT_METHODS'
      });
    }

    const totalPrice = (quantity * listing.price) * 1.01;

    const newOrder = new Order({
      userId: req.userId,
      listingId,
      sellerId,
      referenceNumber,
      proofImage,
      quantity,
      totalPrice,
      status: 'Pending',
      BuyerStatus: 'NotYetReceived',
    });

    await newOrder.save();

    console.log(`[CHECKOUT_SUCCESS] User ${req.userId} submitted checkout for listing ${listingId}, quantity: ${quantity}`);

    res.status(201).json({
      message: 'Payment details submitted successfully',
      checkout: newOrder,
    });
  } catch (error) {
    console.error('Error submitting payment:', error.message);
    res.status(500).json({ message: 'Failed to submit payment details.' });
  }
};


export const updateCheckoutStatus = async (req, res) => {
  try {
    const { status, approvalNote } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }


    const order = await Order.findById(req.params.id).populate('listingId');

    if (!order) {
      return res.status(404).json({ message: 'Checkout not found.' });
    }


    if (status === 'Success' && order.status !== 'Success') {
      const sellerId = order.listingId.userId;


      const balanceResult = await UserBalance.findOneAndUpdate(
        { userId: sellerId },
        {
          $inc: { sellerBalance: order.totalPrice },
          $push: {
            transactions: {
              amount: order.totalPrice,
              type: 'credit',
              referenceId: order._id,
              timestamp: new Date()
            }
          }
        },
        {
          upsert: true,
          new: true
        }
      );

      if (!balanceResult) {
        return res.status(500).json({ message: 'Failed to update seller balance.' });
      }


      order.status = status;
      order.BuyerStatus = 'Received';
      if (approvalNote) {
        order.approvalNote = approvalNote;
      }

      await order.save();

      console.log(`[SECURE_CHECKOUT_APPROVAL] Checkout ${order._id} approved. Seller ${sellerId} balance updated by ${order.totalPrice}`);
    } else {

      order.status = status;
      if (approvalNote) {
        order.approvalNote = approvalNote;
      }
      await order.save();
    }

    res.status(200).json({ message: 'Checkout status updated successfully.', order });
  } catch (error) {
    console.error('Error updating checkout:', error.message);
    res.status(500).json({ message: 'Failed to update checkout status.', error: error.message });
  }
};

export const receivedCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('listingId');
    if (!order) {
      return res.status(404).json({ message: 'Checkout not found.' });
    }

    if (order.BuyerStatus === 'Received') {
      return res.status(400).json({ message: 'Order already marked as Received.' });
    }

    order.BuyerStatus = 'Received';
    order.status = 'Success';
    await order.save();

    const sellerId = order.listingId.userId;
    const sellerBalance = await UserBalance.findOne({ userId: sellerId });

    if (!sellerBalance) {
      await new UserBalance({
        userId: sellerId,
        sellerBalance: order.totalPrice,
        transactions: [{ amount: order.totalPrice, type: 'credit', referenceId: order._id }],
      }).save();
    } else {
      sellerBalance.sellerBalance += order.totalPrice;
      sellerBalance.transactions.push({
        amount: order.totalPrice,
        type: 'credit',
        referenceId: order._id,
      });
      await sellerBalance.save();
    }

    res.status(200).json({ message: 'Order marked as Received successfully.', order });
  } catch (error) {
    console.error('Error marking order as Received:', error.message);
    res.status(500).json({ message: 'Failed to mark order as Received.', error: error.message });
  }
};