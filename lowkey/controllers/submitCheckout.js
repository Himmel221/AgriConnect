import Order from '../models/Order.js';
import Listing from '../models/Listing.js';
import Cart from '../models/Cart.js';
import PaymentMethod from '../models/PaymentMethod.js';
import User from '../models/User.js'; 

export const submitCheckout = async (req, res) => {
  try {
    const { referenceNumber, listingId, quantity } = req.body;
    const proofImage = req.file?.path;
    const userId = req.userId;

    if (!proofImage) {
      return res.status(400).json({ 
        error: 'Proof image is required',
        message: 'Please provide a proof of payment image',
        code: 'PROOF_REQUIRED'
      });
    }

    if (!listingId || listingId.length !== 24) {
      return res.status(400).json({ 
        error: 'Invalid listing ID',
        message: 'Please provide a valid listing ID',
        code: 'INVALID_LISTING_ID'
      });
    }

    if (!quantity || quantity <= 0 || quantity > 10000) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'Quantity must be between 1 and 10,000',
        code: 'INVALID_QUANTITY'
      });
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
      { new: true }
    );

    if (!listing) {
      return res.status(400).json({ 
        error: 'Listing unavailable',
        message: 'Listing not found, inactive, or insufficient quantity available',
        code: 'LISTING_UNAVAILABLE'
      });
    }


    if (listing.userId.toString() === userId.toString()) {

      await Listing.findByIdAndUpdate(listingId, { $inc: { quantity: quantity } });
      return res.status(400).json({
        error: 'Invalid purchase',
        message: 'You cannot purchase your own listing',
        code: 'SELF_PURCHASE'
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

    const basePrice = listing.price * quantity;
    const serviceFee = basePrice * 0.01; 
    const totalPrice = basePrice + serviceFee;


    if (totalPrice > 1000000) {

      await Listing.findByIdAndUpdate(listingId, { $inc: { quantity: quantity } });
      return res.status(400).json({
        error: 'Price too high',
        message: 'Total purchase amount cannot exceed 1,000,000',
        code: 'PRICE_TOO_HIGH'
      });
    }

    // Get buyer and seller information
    const buyer = await User.findById(userId);
    const seller = await User.findById(sellerId);

    if (!buyer || !seller) {
      await Listing.findByIdAndUpdate(listingId, { $inc: { quantity: quantity } });
      return res.status(400).json({
        error: 'User not found',
        message: 'Buyer or seller information not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const newOrder = new Order({
      originalListing: {
        identifier: listing.identifier,
        productName: listing.productName,
        quantity: listing.quantity + quantity, // Original quantity before reduction
        unit: listing.unit,
        category: listing.category,
        details: listing.details,
        location: listing.location,
        price: listing.price,
        imageUrl: listing.imageUrl,
        minimumOrder: listing.minimumOrder,
        listedDate: listing.listedDate
      },
      seller: {
        sellerId: sellerId,
        sellerName: `${seller.first_name} ${seller.last_name}`,
        sellerEmail: seller.email,
        sellerLocation: seller.location || 'Not specified'
      },
      buyer: {
        buyerId: userId,
        buyerName: `${buyer.first_name} ${buyer.last_name}`,
        buyerEmail: buyer.email,
        buyerLocation: buyer.location || 'Not specified'
      },
      orderQuantity: quantity,
      totalPrice: totalPrice,
      payment: {
        referenceNumber: referenceNumber.trim().substring(0, 50),
        proofImage: proofImage
      },
      status: 'Pending',
      buyerStatus: 'NotYetReceived',
      metadata: {
        originalListingId: listingId
      }
    });

    await newOrder.save();

    await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: listingId } } }, 
      { new: true }
    );

        
    console.log(`[SECURE_CHECKOUT_SUBMIT] User ${userId} submitted order: ${newOrder._id} for listing: ${listingId}`);

    res.status(201).json({ 
      success: true,
      message: 'Order submitted successfully', 
      order: newOrder,
      removedItem: listingId 
    });
  } catch (error) {
    console.error('[CHECKOUT_SUBMIT_ERROR]', error.message);
    res.status(500).json({ 
      error: 'Failed to submit checkout',
      message: 'An error occurred while processing your checkout. Please try again.',
      code: 'SUBMIT_ERROR'
    });
  }
};