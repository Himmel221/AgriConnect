import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Listing from '../models/Listing.js';
import Cart from '../models/Cart.js'; 

export const submitCheckout = async (req, res) => {
  try {
    const { bank, referenceNumber, listingId, quantity } = req.body;
    const proofImage = req.file?.path;
    const userId = req.userId;

    if (!proofImage) {
      return res.status(400).json({ message: 'Proof image is required.' });
    }

    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required.' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const sellerId = listing.userId;

    const newCheckout = new CheckoutSubmission({
      userId,
      listingId,
      sellerId,
      bank,
      referenceNumber,
      proofImage,
      quantity,
      totalPrice: quantity * listing.price * 1.01,
      status: 'Pending',
      BuyerStatus: 'NotYetReceived',
    });

    await newCheckout.save();

    await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: listingId } } }, 
      { new: true }
    );

    res.status(201).json({ 
      message: 'Checkout submitted successfully', 
      checkout: newCheckout,
      removedItem: listingId 
    });
  } catch (error) {
    console.error('Error submitting checkout:', error.message);
    res.status(500).json({ message: 'Failed to submit checkout proof', error: error.message });
  }
};