import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/db.js';
import authRoutes from "./routes/authRoutes.js";
import listingsRoute from './routes/listings.js';
import cartRoutes from './routes/cartRoutes.js';
import userRoutes from './routes/userRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import AdminRoutes from './routes/Admin.js'; 
import auth from './middleware/auth.js'; 
import jwt from 'jsonwebtoken';
import checkoutRoutes from './routes/checkoutRoutes.js';
import checkoutStatusRoutes from './routes/checkoutStatus.js';
import sellerOrdersRoutes from './routes/sellerOrdersRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import buyerOrdersRoutes from './routes/buyerOrdersRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js'; 
import securityRoutes from './routes/securityRoutes.js';
import User from './models/User.js';

import { 
  enhancedDdosProtection, 
  enhancedAuthRateLimit, 
  enhancedApiRateLimit, 
  enhancedUploadRateLimit,
  trackEnhancedFailedAuth 
} from './middleware/rateLimiter.js';
import { globalSanitizationMiddleware } from './utils/unifiedValidation.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

server.keepAliveTimeout = 30000; 
server.headersTimeout = 35000; 

const allowedOrigins = [
  process.env.CLIENT,
  'https://agriconnect-1-81dp.onrender.com'
];

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
  
app.use(
  bodyParser.json({
    limit: '10mb', 
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ message: 'Invalid JSON payload' });
        throw new Error('Invalid JSON');
      }
    },
  })
);
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); 

app.use((req, res, next) => {
  req.setTimeout(30000); 
  res.setTimeout(30000);
  next();
});

// 300 req per 15 min only
import rateLimit from 'express-rate-limit';

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mimns
  max: 300, // request num
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes.',
      retryAfter: 15 * 60
    });
  }
});

app.use(globalRateLimit);
app.use(enhancedDdosProtection);
app.use(trackEnhancedFailedAuth);
app.use(globalSanitizationMiddleware);

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', enhancedAuthRateLimit, authRoutes);
app.use('/api/listings', enhancedApiRateLimit, listingsRoute);
app.use('/api/cart', enhancedApiRateLimit, cartRoutes);
app.use('/api/inventory', enhancedApiRateLimit, inventoryRoutes);
app.use('/api/admin', enhancedApiRateLimit, AdminRoutes);
app.use('/api/users', enhancedApiRateLimit, auth, userRoutes);
app.use('/api/messages', enhancedApiRateLimit, (req, res, next) => {
  console.log(`Message Route: ${req.method} ${req.url}`);
  next();
}, auth, messageRoutes);
app.use('/api/checkout', enhancedApiRateLimit, checkoutRoutes);
app.use('/api/withdraw', enhancedApiRateLimit, withdrawalRoutes);
app.use('/api/checkout-status', enhancedApiRateLimit, checkoutStatusRoutes);
app.use('/api/orders/seller-orders', enhancedApiRateLimit, sellerOrdersRoutes);
app.use('/api/orders', enhancedApiRateLimit, sellerOrdersRoutes);
app.use('/api/orders/buyer-orders', enhancedApiRateLimit, buyerOrdersRoutes);
app.use('/api/payment-methods', enhancedApiRateLimit, auth, paymentRoutes); 
app.use('/api/security', enhancedApiRateLimit, securityRoutes);

app.get('/api/weather-key', enhancedApiRateLimit, (req, res) => {
  res.json({ apiKey: process.env.OpenWeatherApp_API_KEY });
});

app.get('/testlamang', enhancedApiRateLimit, (req, res) => {
  res.send('Server is running!');
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
}); //meow


app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.userId;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinRoom', ({ senderId, recipientId, token }) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        socket.emit('error', 'Authentication failed');
        return;
      }
      socket.join([senderId, recipientId].sort().join('-'));
      console.log(`${socket.id} joined room ${senderId}-${recipientId}`);
    });
  });

  socket.on('sendMessage', async ({ senderId, recipientId, content }) => {
    try {
      const sender = await User.findById(senderId).select('isVerified');
      if (!sender || !sender.isVerified) {
        socket.emit('error', 'Please verify your email address to send messages');
        return;
      }

      const roomId = [senderId, recipientId].sort().join('-');
      const messageData = {
        senderId,
        recipientId,
        content,
        timestamp: new Date(),
      };

      io.to(roomId).emit('receiveMessage', messageData);
      console.log('Message sent:', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
      console.log('Prot enabled');
    });
  } catch (error) {
    console.log(error);
  }
};

start();
