const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    // Force localhost connection - prevent accidental production database connection
    let mongoURI = process.env.MONGODB_URI;
    
    // If MONGODB_URI is not set, use localhost
    if (!mongoURI) {
      mongoURI = 'mongodb://localhost:27018/phoneclubs';
      console.log('⚠️  MONGODB_URI not set, using localhost default');
    }
    
    // Safety check: Warn if trying to connect to non-localhost in development
    if (process.env.NODE_ENV !== 'production' && mongoURI && !mongoURI.includes('localhost') && !mongoURI.includes('127.0.0.1')) {
      console.warn('⚠️  WARNING: Attempting to connect to non-localhost database!');
      console.warn('⚠️  This might be a production database. Please check your MONGODB_URI.');
        console.warn('⚠️  For localhost, use: mongodb://localhost:27017/phoneclubs');
      
      // In development, force localhost for safety
      if (process.env.FORCE_LOCALHOST !== 'false') {
        console.log('🛡️  Forcing localhost connection for safety...');
        mongoURI = 'mongodb://localhost:27017/phoneclubs';
      }
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    // Verify it's localhost
    if (conn.connection.host.includes('localhost') || conn.connection.host.includes('127.0.0.1')) {
      console.log('✅ Confirmed: Connected to LOCAL database');
    } else {
      console.warn('⚠️  WARNING: Connected to non-local database!');
    }
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('💡 Make sure MongoDB is running on localhost:27018');
    console.error('💡 Or set MONGODB_URI in your .env file');
    process.exit(1);
  }
};

module.exports = connectDB;
