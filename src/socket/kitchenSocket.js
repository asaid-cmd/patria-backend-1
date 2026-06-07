const { getIO } = require('../services/socketService');

const setupKitchenSocket = () => {
  const io = getIO();

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('kitchen:join', (data) => {
      socket.join('kitchen');
      console.log(`👨‍🍳 Kitchen staff joined: ${socket.id}`);
    });

    socket.on('order:join', (data) => {
      const { orderId } = data;
      socket.join(`order-${orderId}`);
      console.log(`📦 Joined order room: order-${orderId}`);
    });

    socket.on('kitchen:order-status-update', (data) => {
      const { orderId, status, message } = data;
      io.to('kitchen').emit('kitchen:order-updated', {
        orderId,
        status,
        message,
        timestamp: new Date(),
      });
      io.to(`order-${orderId}`).emit('order:status-changed', {
        orderId,
        status,
      });
      console.log(`✅ Order ${orderId} status updated to ${status}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`⚠️ Socket error: ${error}`);
    });
  });
};

module.exports = { setupKitchenSocket };
