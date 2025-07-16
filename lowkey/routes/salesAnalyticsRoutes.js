import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({
      'seller.sellerId': userId
    });

    const inventoryItems = await Inventory.find({ userId: userId });

    const salesData = orders.map(order => {
      const inventoryItem = inventoryItems.find(item => 
        item._id.toString() === order.metadata?.originalListingId?.toString()
      );

      return {
        _id: order._id,
        productName: order.originalListing?.productName || 'Unknown Product',
        quantity: order.orderQuantity,
        totalPrice: order.totalPrice,
        status: order.status,
        buyerStatus: order.buyerStatus,
        submittedAt: order.orderCreatedAt,
        reviewedAt: order.review?.reviewedAt,
        approvalNote: order.review?.approvalNote
      };
    });

    const successfulOrders = salesData.filter(sale => sale.status === 'Success');

    const analytics = {
      totalOrders: salesData.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + sale.totalPrice, 0),
      successfulOrders: {
        count: successfulOrders.length,
        revenue: successfulOrders.reduce((sum, sale) => sum + sale.totalPrice, 0),
        orders: successfulOrders.map(order => ({
          productName: order.productName,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          submittedAt: order.submittedAt,
          buyerStatus: order.buyerStatus
        }))
      },
      ordersByStatus: {
        Pending: salesData.filter(sale => sale.status === 'Pending').length,
        Ongoing: salesData.filter(sale => sale.status === 'Ongoing').length,
        Success: successfulOrders.length,
        Rejected: salesData.filter(sale => sale.status === 'Rejected').length
      },
      ordersByBuyerStatus: {
        NotYetReceived: salesData.filter(sale => sale.buyerStatus === 'NotYetReceived').length,
        Received: salesData.filter(sale => sale.buyerStatus === 'Received').length,
        Cancelled: salesData.filter(sale => sale.buyerStatus === 'Cancelled').length
      },
      salesByDate: salesData.reduce((acc, sale) => {
        const date = new Date(sale.submittedAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + sale.totalPrice;
        return acc;
      }, {}),
      revenueByProduct: salesData.reduce((acc, sale) => {
        acc[sale.productName] = (acc[sale.productName] || 0) + sale.totalPrice;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      salesData,
      analytics
    });

  } catch (error) {
    console.error('❌ Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales analytics',
      error: error.message
    });
  }
});

router.get('/date-range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    const query = {
      'seller.sellerId': userId,
      orderCreatedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const salesData = await Order.find(query)
      .sort({ orderCreatedAt: 1 });

    res.status(200).json({
      success: true,
      salesData
    });

  } catch (error) {
    console.error('❌ Error fetching sales data for date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales data for date range',
      error: error.message
    });
  }
});

// Get product performance metrics
router.get('/product-performance', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const salesData = await Order.find({ 'seller.sellerId': userId });

    const productPerformance = salesData.reduce((acc, sale) => {
      const productId = sale.metadata?.originalListingId?.toString();
      if (!acc[productId]) {
        acc[productId] = {
          totalSales: 0,
          totalRevenue: 0,
          orderCount: 0,
          averageOrderValue: 0
        };
      }

      acc[productId].totalSales += sale.orderQuantity;
      acc[productId].totalRevenue += sale.totalPrice;
      acc[productId].orderCount += 1;
      acc[productId].averageOrderValue = acc[productId].totalRevenue / acc[productId].orderCount;

      return acc;
    }, {});

    res.status(200).json({
      success: true,
      productPerformance
    });

  } catch (error) {
    console.error('❌ Error fetching product performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product performance',
      error: error.message
    });
  }
});

router.get('/successful-orders', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const successfulOrders = await Order.find({
      'seller.sellerId': userId,
      status: 'Success'
    })
    .sort({ orderCreatedAt: -1 }); 

    const formattedOrders = successfulOrders.map(order => ({
      _id: order._id,
      productName: order.originalListing?.productName || 'Unknown Product',
      quantity: order.orderQuantity,
      totalPrice: order.totalPrice,
      submittedAt: order.orderCreatedAt,
      buyerStatus: order.buyerStatus,
      approvalNote: order.review?.approvalNote
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('❌ Error fetching successful orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching successful orders',
      error: error.message
    });
  }
});

export default router; 