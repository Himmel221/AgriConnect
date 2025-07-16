//cartRoutes.js

import express from 'express';
import auth from '../middleware/auth.js';
import { getCart, addToCart, removeFromCart, updateCart } from '../controllers/cartController.js';

const router = express.Router();

router.get('/', auth, getCart); 
router.post('/add', auth, addToCart); 
router.post('/remove', auth, removeFromCart); 
router.post('/update', auth, updateCart);

export default router;