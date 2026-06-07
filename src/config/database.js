const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patria', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    return conn;
  } catch (error) {
    throw new Error(`MongoDB Connection Error: ${error.message}`);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    throw new Error(`MongoDB Disconnection Error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
