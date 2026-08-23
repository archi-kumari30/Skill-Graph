const app = require('./app');
const connectDB = require('./config/db');
const { connectCognoDB } = require('./config/cognodb');
const config = require('./config/config');

// Connect to Database first, then start the server
connectDB().then(async () => {
  try {
    await connectCognoDB();
  } catch (err) {
    console.error('CognoDB initialization error:', err.message);
  }

  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch(err => {
  console.error('Failed to initialize database connection. Server not started.', err);
  process.exit(1);
});
