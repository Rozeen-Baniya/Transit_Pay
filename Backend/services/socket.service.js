const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
let io = null;

function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Simple auth: expect token in handshake auth or query
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication token required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      socket.userId = payload.id;
      // join user room
      socket.join(`user:${socket.userId}`);
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.userId);
    
    // Handle transport connection
    socket.on('transportConnect', async (transportId) => {
      if (!transportId) return;
      try {
        const Transport = require('../models/transport.model');
        await Transport.findByIdAndUpdate(transportId, {
          'connectionState.isOnline': true,
          'connectionState.lastSeen': new Date(),
          'connectionState.socketId': socket.id
        });
        socket.transportId = transportId;
        socket.join(`transport:${transportId}`);
        io.emit('transportStateChange', { transportId, isOnline: true });
      } catch (err) {
        console.error('Error updating transport connection state:', err);
      }
    });

    // Handle location updates
    socket.on('updateLocation', async (data) => {
      if (!socket.transportId || !data.coordinates) return;
      try {
        const Transport = require('../models/transport.model');
        const location = {
          coordinates: data.coordinates,
          speed: data.speed || 0,
          heading: data.heading || 0,
          timestamp: new Date()
        };
        await Transport.findByIdAndUpdate(socket.transportId, {
          location,
          'connectionState.lastSeen': new Date()
        });
        // Emit to all subscribers of this transport
        io.to(`transport:${socket.transportId}`).emit('locationUpdate', {
          transportId: socket.transportId,
          location
        });
      } catch (err) {
        console.error('Error updating transport location:', err);
      }
    });

    socket.on('joinWallet', (walletId) => {
      if (!walletId) return;
      socket.join(`wallet:${walletId}`);
    });

    socket.on('leaveWallet', (walletId) => {
      if (!walletId) return;
      socket.leave(`wallet:${walletId}`);
    });

    socket.on('disconnect', async (reason) => {
      if (socket.transportId) {
        try {
          const Transport = require('../models/transport.model');
          await Transport.findByIdAndUpdate(socket.transportId, {
            'connectionState.isOnline': false,
            'connectionState.lastSeen': new Date(),
            'connectionState.socketId': null
          });
          io.emit('transportStateChange', { 
            transportId: socket.transportId, 
            isOnline: false 
          });
        } catch (err) {
          console.error('Error updating transport disconnect state:', err);
        }
      }
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

function emitToWallet(walletId, event, data) {
  if (!io) return;
  io.to(`wallet:${walletId}`).emit(event, data);
}

module.exports = { initSocket, getIo, emitToUser, emitToWallet };
