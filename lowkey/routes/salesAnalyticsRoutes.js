import express from 'express';
import auth from '../middleware/auth.js';
import CheckoutSubmission from '../models/CheckoutSubmission.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const checkoutSubmissions = await CheckoutSubmission.find({
      userId: userId
    }).populate('listingId');

    const inventoryItems = await Inventory.find({ userId: userId });

    const salesData = checkoutSubmissions.map(submission => {
      const inventoryItem = inventoryItems.find(item => 
        item._id.toString() === submission.listingId._id.toString()
      );

      return {
        _id: submission._id,
        productName: inventoryItem?.productName || 'Unknown Product',
        quantity: submission.quantity,
        totalPrice: submission.totalPrice,
        status: submission.status,
        buyerStatus: submission.BuyerStatus,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        approvalNote: submission.approvalNote
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
      userId: userId,
      submittedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const salesData = await CheckoutSubmission.find(query)
      .populate('listingId')
      .sort({ submittedAt: 1 });

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

    const salesData = await CheckoutSubmission.find({ userId })
      .populate('listingId');

    const productPerformance = salesData.reduce((acc, sale) => {
      const productId = sale.listingId._id.toString();
      if (!acc[productId]) {
        acc[productId] = {
          totalSales: 0,
          totalRevenue: 0,
          orderCount: 0,
          averageOrderValue: 0
        };
      }

      acc[productId].totalSales += sale.quantity;
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

    const successfulOrders = await CheckoutSubmission.find({
      userId: userId,
      status: 'Success'
    })
    .populate('listingId')
    .sort({ submittedAt: -1 }); 

    const formattedOrders = successfulOrders.map(order => ({
      _id: order._id,
      productName: order.listingId?.productName || 'Unknown Product',
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      submittedAt: order.submittedAt,
      buyerStatus: order.BuyerStatus,
      approvalNote: order.approvalNote
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