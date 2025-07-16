import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Listing from '../models/Listing.js';
import Cart from '../models/Cart.js'; 

export const submitCheckout = async (req, res) => {
  try {
    const { bank, referenceNumber, listingId, quantity } = req.body;
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

    const newCheckout = new CheckoutSubmission({
      userId,
      listingId,
      sellerId,
      bank: bank.trim().substring(0, 100),
      referenceNumber: referenceNumber.trim().substring(0, 50),
      proofImage,
      quantity,
      totalPrice,
      status: 'Pending',
      BuyerStatus: 'NotYetReceived'
    });

    await newCheckout.save();


    await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: listingId } } }, 
      { new: true }
    );

        
    console.log(`[SECURE_CHECKOUT_SUBMIT] User ${userId} submitted checkout: ${newCheckout._id} for listing: ${listingId}`);

    res.status(201).json({ 
      success: true,
      message: 'Checkout submitted successfully', 
      checkout: newCheckout,
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