const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SkillGraph REST API',
    version: '1.0.0',
    description: 'Comprehensive OpenAPI specification for SkillGraph career readiness, skill taxonomy graph, and job matching platform.',
    contact: {
      name: 'SkillGraph Development Team'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'SkillGraph API Gateway'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token retrieved from /api/auth/login or /api/auth/register'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only refresh token cookie for session rotation'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
