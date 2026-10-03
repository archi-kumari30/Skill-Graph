process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const { connectCognoDB } = require('./config/cognodb');
const config = require('./config/config');
const { runCatalogSeed } = require('./seed/seedCatalog');

// Validate configuration
const validation = config.validateConfig();
if (validation.warnings.length > 0) {
  validation.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
}

// Connect to Database first, then start the server
connectDB().then(async () => {
  try {
    console.log('Running safe catalog database seeding on startup...');
    await runCatalogSeed();
    console.log('Safe catalog database seeding completed successfully.');
  } catch (err) {
    console.error('Safe catalog seeding failed on startup:', err.message);
  }

  try {
    await connectCognoDB();
  } catch (err) {
    console.error('CognoDB initialization error:', err.message);
  }

  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` SkillGraph Backend Engine v1.0.0`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Port:        ${PORT}`);
    console.log(` API Docs:    http://localhost:${PORT}/api/docs`);
    console.log(` Health:      http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch(err => {
  console.error('Failed to initialize database connection. Server not started.', err);
  process.exit(1);
});
