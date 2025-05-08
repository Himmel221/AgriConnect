/***const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingsRoute = require('./routes/listings.js'); 

const app = express();*/

//server.js

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
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


dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT,
    methods: ['GET', 'POST'],
  },
});

const corsOptions = {
  origin: process.env.CLIENT,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(
  bodyParser.json({
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
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoute);
app.use('/api/cart', cartRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/messages', auth, messageRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/checkout-status', checkoutStatusRoutes);
app.use('/api/orders/seller-orders', sellerOrdersRoutes);
app.use('/api/orders', sellerOrdersRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders/buyer-orders', buyerOrdersRoutes);



app.get('/api/weather-key', (req, res) => {
  res.json({ apiKey: process.env.OpenWeatherApp_API_KEY });
});

app.get('/testlamang', (req, res) => {
  res.send('Server is running!');
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

  socket.on('sendMessage', ({ senderId, recipientId, content }) => {
    const roomId = [senderId, recipientId].sort().join('-');
    const messageData = {
      senderId,
      recipientId,
      content,
      timestamp: new Date(),
    };

    io.to(roomId).emit('receiveMessage', messageData);
    console.log('Message sent:', messageData);
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
    });
  } catch (error) {
    console.log(error);
  }
};

start();