const express = require('express');
const router = express.Router();

// GET /api/auth/check
router.get('/check', (req, res) => {
  // Add explicit CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Return a simple response
  res.json({ 
    authenticated: false, 
    message: 'Auth endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;