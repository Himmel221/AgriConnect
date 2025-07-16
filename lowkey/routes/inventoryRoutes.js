import express from 'express';
import auth from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.userId; 
    console.log('Creating inventory for User ID:', userId);

    if (!userId) return res.status(400).json({ message: "User ID is missing from authentication." });

    const { productName, category, quantity, unit, price, expirationDate, supplySchedule, stockThreshold,
      supplyCapacityDaily, supplyCapacityWeekly, priceSchedule, storageTemp, humidity, packagingType,
      certificationType, processingMethod, packagingSize, preferredSoil, bestClimate, batchNumber,
      qrCodeUrl, supplierInfo, deliveryOptions, stockAvailability } = req.body;

    if (isNaN(quantity)) return res.status(400).json({ message: "Quantity must be a valid number." });

    const newInventory = new Inventory({
      productName, category, quantity, unit, price, expirationDate, supplySchedule, stockThreshold,
      supplyCapacityDaily, supplyCapacityWeekly, priceSchedule, storageTemp, humidity, packagingType,
      certificationType, processingMethod, packagingSize, preferredSoil, bestClimate, batchNumber,
      qrCodeUrl, supplierInfo, deliveryOptions, stockAvailability,
      priceHistory: [{ date: new Date(), price }],
      userId, 
    });

    await newInventory.save();
    res.status(201).json({ message: 'Inventory item created successfully!', inventory: newInventory });
  } catch (error) {
    console.error('❌ Error creating inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  console.log("✅ API `/api/inventory` was requested!");
  const { category, minPrice, maxPrice } = req.query;
  const query = { userId: req.userId }; 

  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const inventoryItems = await Inventory.find(query);
  res.status(200).json({ inventoryItems });
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    await Inventory.findByIdAndDelete(id);
    res.status(200).json({ message: 'Inventory item deleted successfully!' });
  } catch (error) {
    console.error('❌ Error deleting inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/low-stock', auth, async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ userId: req.userId, quantity: { $lte: req.query.stockThreshold || 10 } });
    res.status(200).json({ lowStockItems });
  } catch (error) {
    console.error('❌ Error fetching low-stock items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;