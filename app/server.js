const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/database');
const smsRoutes = require('./routes/smsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/sms', smsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
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
    process.exit(1);
  }
};

startServer();