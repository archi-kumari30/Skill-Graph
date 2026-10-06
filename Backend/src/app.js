require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const config = require('./config/config');
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
const jobRoutes = require('./routes/jobRoutes');
const learningRoutes = require('./routes/learningRoutes');
const aiRoutes = require('./routes/aiRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const activityRoutes = require('./routes/activityRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const collegeRoutes = require('./routes/collegeRoutes');

const app = express();


// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. Dynamic CORS setup supporting multiple local development ports (Vite 5173, 5174, 5175, etc.)
// while strictly maintaining credentials/cookie authentication and production domain validation
const configuredOrigins = [
  config.clientUrl,
  process.env.CLIENT_URL,
  'https://skill-graph-noym.onrender.com'
].filter(Boolean);

const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // In development or test, allow any local port (e.g. localhost:5173, 5174, 5175, etc.)
    if (config.nodeEnv !== 'production' && localOriginRegex.test(origin)) {
      return callback(null, true);
    }

    // Match against configured production client URLs
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
if (config.nodeEnv !== 'test') {
  app.use('/api', limiter);
}

// 4. Request Logging using Morgan
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 5. Body parser (reading data from body into req.body)
app.use(express.json({ limit: '10kb' }));

// 6. Cookie parser with signing support
app.use(cookieParser(config.cookieSecret));

// 7. Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 8. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/skill-graph', skillGraphRoutes);
app.use('/api/roles', roleRoutes);
app.use(['/api/skill-gap', '/api/skill-gaps'], skillGapRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interview-prep', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/colleges', collegeRoutes);

// Swagger OpenAPI Documentation

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 9. Comprehensive Health Check endpoint (mounted at /health and /api/health)
app.get(['/health', '/api/health'], (req, res) => {
  const mongoose = require('mongoose');
  const { getDriver } = require('./config/cognodb');
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const graphStatus = getDriver && getDriver() ? 'connected' : (config.useGraphDb ? 'connecting' : 'disabled');

  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      database: mongoStatus,
      graphEngine: graphStatus
    },
    environment: config.nodeEnv
  });
});

// 10. Route 404 fallback
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// 11. Global Centralized Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
