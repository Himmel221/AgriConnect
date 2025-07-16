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


    const combinedItems = new Map();
    
    cart.items.forEach(item => {
      const productId = item.productId?._id?.toString();
      if (!productId) {

        const key = `deleted_${item._id}`;
        if (combinedItems.has(key)) {
          combinedItems.get(key).quantity += item.quantity;
        } else {
          combinedItems.set(key, {
            ...item.toObject(),
            productId: null,
            productName: 'Deleted Product',
          });
        }
      } else {

        if (combinedItems.has(productId)) {
          combinedItems.get(productId).quantity += item.quantity;
        } else {
          combinedItems.set(productId, {
            ...item.toObject(),
            productName: item.productId.productName,
          });
        }
      }
    });

    const cartItems = Array.from(combinedItems.values());

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

    
    const listing = await Listing.findById(productId);
    if (!listing) {
      return res.status(404).json({ message: 'Product not found' });
    }


    if (listing.userId.toString() === userId.toString()) {
      return res.status(400).json({ 
        message: 'You cannot add your own listing to the cart',
        code: 'OWN_LISTING_ERROR'
      });
    }

    const updatedListing = await Listing.findOneAndUpdate(
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

    if (!updatedListing) {
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

    
    let itemToRemove;
    let isDeletedProduct = false;

    
    itemToRemove = cart.items.find(item => 
      item.productId && item.productId.toString() === productId
    );

   
    if (!itemToRemove) {
      itemToRemove = cart.items.find(item => 
        item._id.toString() === productId
      );
      isDeletedProduct = true;
    }

    if (!itemToRemove) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    
    let updatedCart;
    if (isDeletedProduct) {
      
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: productId } } },
        { new: true }
      );
    } else {
      
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId } } },
        { new: true }
      );

        
      if (itemToRemove.reservedAt && itemToRemove.productId) {
        await Listing.findByIdAndUpdate(
          itemToRemove.productId,
          { $inc: { quantity: itemToRemove.quantity } }
        );
      }
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

export const updateCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: 'Valid product ID and quantity are required',
        code: 'INVALID_INPUT'
      });
    }

    
    const listing = await Listing.findById(productId);
    if (!listing) {
      console.log(`[UPDATE_CART] Product not found: ${productId}`);
      return res.status(404).json({ 
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    
    const minimumOrder = listing.minimumOrder || 1;
    if (quantity < minimumOrder) {
      return res.status(400).json({ 
        message: `Minimum order quantity is ${minimumOrder}. Cannot reduce quantity below this limit.`,
        code: 'MINIMUM_ORDER_VIOLATION',
        minimumOrder: minimumOrder
      });
    }

    
    if (!listing.status || listing.quantity < quantity) {
      return res.status(400).json({ 
        message: 'Product is not available or insufficient quantity',
        code: 'INSUFFICIENT_QUANTITY'
      });
    }

    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log(`[UPDATE_CART] Cart not found for user: ${userId}`);
      return res.status(404).json({ 
        message: 'Cart not found',
        code: 'CART_NOT_FOUND'
      });
    }

      
    const cartItems = cart.items.filter(item => 
      item.productId && item.productId.toString() === productId
    );

    if (cartItems.length === 0) {
      console.log(`[UPDATE_CART] Item not found in cart: ${productId} for user: ${userId}`);
      return res.status(404).json({ 
        message: 'Item not found in cart',
        code: 'ITEM_NOT_FOUND'
      });
    }

    console.log(`[UPDATE_CART] Updating quantity for product ${productId} from ${cartItems.reduce((sum, item) => sum + item.quantity, 0)} to ${quantity}`);

    
    const totalOldQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const quantityDifference = quantity - totalOldQuantity;

    
    if (quantityDifference !== 0) {
      await Listing.findByIdAndUpdate(
        productId,
        { $inc: { quantity: totalOldQuantity - quantity } }
      );
    }

    
    cart.items = cart.items.filter(item => 
      !item.productId || item.productId.toString() !== productId
    );

    
    cart.items.push({
      productId: productId,
      quantity: quantity,
      reservedAt: new Date()
    });

    await cart.save();


    const updatedCart = await Cart.findOne({ userId }).populate('items.productId');
    
    
    const combinedItems = new Map();
    
    updatedCart.items.forEach(item => {
      const productId = item.productId?._id?.toString();
      if (!productId) {
        const key = `deleted_${item._id}`;
        if (combinedItems.has(key)) {
          combinedItems.get(key).quantity += item.quantity;
        } else {
          combinedItems.set(key, {
            ...item.toObject(),
            productId: null,
            productName: 'Deleted Product',
          });
        }
      } else {
        if (combinedItems.has(productId)) {
          combinedItems.get(productId).quantity += item.quantity;
        } else {
          combinedItems.set(productId, {
            ...item.toObject(),
            productName: item.productId.productName,
          });
        }
      }
    });

    const finalCartItems = Array.from(combinedItems.values());

    console.log(`[UPDATE_CART] Successfully updated cart for user ${userId}, product ${productId}`);

    res.status(200).json({ 
      message: 'Cart updated successfully', 
      cartItems: finalCartItems,
      updatedQuantity: quantity,
      minimumOrder: minimumOrder
    });
  } catch (error) {
    console.error('[UPDATE_CART_ERROR]', error.message);
    res.status(500).json({ 
      message: 'Error updating cart', 
      error: error.message,
      code: 'UPDATE_ERROR'
    });
  }
};

export const checkoutCart = async (req, res) => {
  try {
    const userId = req.user._id;
    

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }

    const stockValidationResults = [];
    for (const item of cart.items) {
      if (!item.productId || !item.productId.status) {
        return res.status(400).json({ 
          message: `Product ${item.productId?.productName || 'Unknown'} is no longer available.`,
          code: 'PRODUCT_UNAVAILABLE'
        });
      }

      
      if (item.productId.quantity < item.quantity) {
        stockValidationResults.push({
          productId: item.productId._id,
          productName: item.productId.productName,
          requestedQuantity: item.quantity,
          availableQuantity: item.productId.quantity,
          insufficientQuantity: item.quantity - item.productId.quantity
        });
      }
    }

    
    if (stockValidationResults.length > 0) {
      return res.status(400).json({
        message: 'Some items have insufficient stock.',
        code: 'INSUFFICIENT_STOCK',
        stockIssues: stockValidationResults
      });
    }

    
    const processedItems = [];
    const failedItems = [];

    for (const item of cart.items) {
      try {
        
        const updatedListing = await Listing.findOneAndUpdate(
          { 
            _id: item.productId._id,
            status: true,
            quantity: { $gte: item.quantity }
          },
          { 
            $inc: { quantity: -item.quantity } 
          },
          { 
            new: true,
            runValidators: true
          }
        );

        if (!updatedListing) {
          failedItems.push({
            productId: item.productId._id,
            productName: item.productId.productName,
            requestedQuantity: item.quantity,
            reason: 'Stock became insufficient during checkout'
          });
        } else {
          processedItems.push({
            productId: item.productId._id,
            quantity: item.quantity,
            totalPrice: item.productId.price * item.quantity,
          });
        }
      } catch (error) {
        console.error(`Error processing item ${item.productId._id}:`, error.message);
        failedItems.push({
          productId: item.productId._id,
          productName: item.productId.productName,
          requestedQuantity: item.quantity,
          reason: 'Processing error'
        });
      }
    }

    
    if (failedItems.length > 0) {
      return res.status(400).json({
        message: 'Some items could not be processed due to insufficient stock.',
        code: 'PARTIAL_CHECKOUT_FAILURE',
        failedItems,
        processedItems
      });
    }

    
    const checkoutItems = processedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));

    const newCheckout = new CheckoutSubmission({
      userId,
      items: checkoutItems,
      status: 'Pending', 
      BuyerStatus: 'NotYetReceived', 
    });

    await newCheckout.save();

        
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }
    );

    console.log(`[CART_CHECKOUT_SUCCESS] User ${userId} completed checkout with ${processedItems.length} items`);

    res.status(201).json({ 
      message: 'Checkout successful', 
      checkout: newCheckout,
      processedItems: processedItems.length
    });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    res.status(500).json({ message: 'Error during checkout', error: error.message });
  }
};