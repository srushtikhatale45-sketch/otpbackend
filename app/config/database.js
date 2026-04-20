const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Use PostgreSQL for production (Render) and SQLite for local development
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction && process.env.DATABASE_URL) {
  // Use PostgreSQL for Render with Neon
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for Neon
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
  console.log('🔧 Using PostgreSQL (Neon) for production');
} else {
  // Use SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
  });
  console.log('🔧 Using SQLite for development');
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync models (be careful with this in production)
    if (!isProduction) {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced (development)');
    } else {
      // In production, you might want to use migrations instead
      await sequelize.sync();
      console.log('✅ Database synced (production)');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    // Don't exit on Render, just log the error
    if (!isProduction) {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };