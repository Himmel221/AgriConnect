//cartController.js

import Cart from '../models/Cart.js';
import Listing from '../models/Listing.js'; 
import CheckoutSubmission from '../models/CheckoutSubmission.js'; 

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId');
    if (!cart) {
      return res.status(200).json({ cartItems: [] });
    }

    const cartItems = cart.items.map(item => {
      if (!item.productId) {
        return {
          ...item.toObject(),
          productId: null,
          productName: 'Deleted Product', 
        };
      }
      return {
        ...item.toObject(),
        productName: item.productId.productName, 
      };
    });

    res.status(200).json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart items:', error.message);
    res.status(500).json({ message: 'Error fetching cart items.' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid product ID and quantity are required' });
    }

    const listing = await Listing.findOneAndUpdate(
      { 
        _id: productId,
        status: true, 
        quantity: { $gte: quantity } 
      },
      { 
        $inc: { quantity: -quantity } 
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: 'Product not found or insufficient quantity available' });
    }


    const cart = await Cart.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          items: { 
            productId, 
            quantity,
            reservedAt: new Date() 
          } 
        }
      },
      { 
        upsert: true, 
        new: true 
      }
    );


    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && 
      !item.reservedAt 
    );

    if (existingItemIndex !== -1) {

      cart.items[existingItemIndex].quantity += quantity;
      await cart.save();
    }

    res.status(200).json({ 
      message: 'Item added to cart', 
      cartItems: cart.items,
      reservedQuantity: quantity
    });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }


    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }


    const itemToRemove = cart.items.find(item => 
      item.productId && item.productId.toString() === productId
    );

    if (!itemToRemove) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }


    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );


    if (itemToRemove.reservedAt) {
      await Listing.findByIdAndUpdate(
        productId,
        { $inc: { quantity: itemToRemove.quantity } }
      );
    }

    res.status(200).json({ 
      message: 'Item removed from cart', 
      cartItems: updatedCart.items,
      returnedQuantity: itemToRemove.quantity
    });
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
};

export const checkoutCart = async (req, res) => {
  try {
    const userId = req.user._id;
    

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    
    for (const item of cart.items) {
      if (!item.productId || !item.productId.status) {
        return res.status(400).json({ 
          message: `Product ${item.productId?.productName || 'Unknown'} is no longer available.` 
        });
      }
    }

    const checkoutItems = cart.items.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      totalPrice: item.productId.price * item.quantity,
    }));

    const newCheckout = new CheckoutSubmission({
      userId,
      items: checkoutItems,
      status: 'Pending', 
      BuyerStatus: 'NotYetReceived', 
    });

    await newCheckout.save();

    // ATOMIC OPERATION: Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }
    );

    res.status(201).json({ message: 'Checkout successful', checkout: newCheckout });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    res.status(500).json({ message: 'Error during checkout', error: error.message });
  }
};