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

    const listing = await Listing.findById(productId); 
    if (!listing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId.equals(productId));
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cartItems: cart.items });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => !item.productId || item.productId.equals(productId));
    await cart.save();

    res.status(200).json({ message: 'Item removed from cart', cartItems: cart.items });
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

    cart.items = [];
    await cart.save();

    res.status(201).json({ message: 'Checkout successful', checkout: newCheckout });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    res.status(500).json({ message: 'Error during checkout', error: error.message });
  }
};