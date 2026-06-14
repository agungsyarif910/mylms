// Vercel serverless function entry point
// Imports the pre-compiled NestJS serverless handler from dist/
let handler;

try {
  const serverless = require('../dist/src/serverless');
  handler = serverless.default || serverless;
} catch (error) {
  console.error('Failed to load serverless handler:', error.message);
  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      message: 'Server initialization failed. Please check build output.',
      error: error.message,
    });
  };
}

module.exports = handler;
