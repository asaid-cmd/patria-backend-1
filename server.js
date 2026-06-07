const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { initSocket } = require('./src/services/socketService');
const { setupKitchenSocket } = require('./src/socket/kitchenSocket');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const connectDatabaseAndStart = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    initSocket(server);
    setupKitchenSocket();
    console.log('✅ Socket.IO initialized');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

connectDatabaseAndStart();

module.exports = server;
