// middleware/corsMiddleware.js
const cors = require('cors');
const corsOptions = require('../config/corsConfig');

// Standard CORS middleware
const corsMiddleware = cors(corsOptions);

// Additional manual CORS headers for extra safety
const manualCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://otpfrontend-sigma.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

module.exports = { corsMiddleware, manualCorsHeaders };