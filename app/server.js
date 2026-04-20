const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/database');
const { corsMiddleware, manualCorsHeaders } = require('./middleware/corsMiddleware');
const smsRoutes = require('./routes/smsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply CORS middleware FIRST
app.use(corsMiddleware);
app.use(manualCorsHeaders);

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/sms', smsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/auth', authRoutes);

// Health check (add CORS headers explicitly)
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ CORS Test: http://localhost:${PORT}/test-cors`);
      console.log(`\n📝 Available Routes:`);
      console.log(`   POST   /api/sms/send-otp`);
      console.log(`   POST   /api/sms/verify-otp`);
      console.log(`   POST   /api/sms/resend-otp`);
      console.log(`   POST   /api/whatsapp/send-otp`);
      console.log(`   POST   /api/whatsapp/verify-otp`);
      console.log(`   POST   /api/whatsapp/resend-otp`);
      console.log(`   GET    /api/auth/check`);
      console.log(`   POST   /api/auth/logout\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Don't exit, just log
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️ Server running without DB on port ${PORT}`);
    });
  }
};

startServer();