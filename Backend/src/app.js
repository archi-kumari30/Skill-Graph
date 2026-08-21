const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const errorMiddleware = require('./middleware/errorMiddleware');
const { NotFoundError } = require('./utils/customErrors');

// Import individual route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const skillGraphRoutes = require('./routes/skillGraphRoutes');
const roleRoutes = require('./routes/roleRoutes');
const skillGapRoutes = require('./routes/skillGapRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const teamRoutes = require('./routes/teamRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS setup
app.use(cors());

// 3. API Rate Limiting (skipped in test mode for testing convenience)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  }
});
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', limiter);
}

// 4. Request Logging using Morgan
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Body parser (reading data from body into req.body)
app.use(express.json({ limit: '10kb' }));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/skill-graph', skillGraphRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/skill-gap', skillGapRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date()
  });
});

// 7. Route 404 fallback
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// 8. Global Centralized Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
