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
const { runAssessmentSeed } = require('./seed/seedAssessments');
const { runInterviewSeed } = require('./seed/seedInterviewQuestions');

// Validate configuration
const validation = config.validateConfig();
if (validation.warnings.length > 0) {
  validation.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
}

// Connect to Database first, then start the server immediately
connectDB().then(async () => {
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

  // Optional startup database seeding (disabled by default in normal production to avoid slow boots)
  const shouldSeed = process.env.SEED_ON_STARTUP === 'true';
  if (shouldSeed) {
    try {
      console.log('Running requested database seeding in background...');
      await runCatalogSeed();
      await runAssessmentSeed();
      await runInterviewSeed();
      const collegeService = require('./services/collegeService');
      await collegeService.seedDefaultColleges();
      console.log('Database seeding completed successfully.');
    } catch (err) {
      console.error('Database seeding failed:', err.message);
    }
  }

  // Connect to CognoDB / Neo4j asynchronously without blocking incoming HTTP traffic
  connectCognoDB().catch(err => {
    console.warn('CognoDB initialization notice (operating in resilient MongoDB fallback mode):', err.message);
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
