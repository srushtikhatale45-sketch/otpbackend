const express = require('express');
const router = express.Router();
const { checkAuth, logout, refreshToken } = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/check', optionalAuth, checkAuth);

module.exports = router;