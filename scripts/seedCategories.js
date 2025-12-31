const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  { name: 'iPhone SE', slug: 'iphone-se' },
  { name: 'iPhone 6', slug: 'iphone-6' },
  { name: 'iPhone 6s', slug: 'iphone-6s' },
  { name: 'iPhone 6 Plus', slug: 'iphone-6-plus' },
  { name: 'iPhone 6s Plus', slug: 'iphone-6s-plus' },
  { name: 'iPhone 7', slug: 'iphone-7' },
  { name: 'iPhone 7 Plus', slug: 'iphone-7-plus' },
  { name: 'iPhone 8', slug: 'iphone-8' },
  { name: 'iPhone 8 Plus', slug: 'iphone-8-plus' },
  { name: 'iPhone X', slug: 'iphone-x' },
  { name: 'iPhone XR', slug: 'iphone-xr' },
  { name: 'iPhone XS', slug: 'iphone-xs' },
  { name: 'iPhone XS Max', slug: 'iphone-xs-max' },
  { name: 'iPhone 11', slug: 'iphone-11' },
  { name: 'iPhone 11 Pro', slug: 'iphone-11-pro' },
  { name: 'iPhone 11 Pro Max', slug: 'iphone-11-pro-max' },
  { name: 'iPhone 12', slug: 'iphone-12' },
  { name: 'iPhone 12 Mini', slug: 'iphone-12-mini' },
  { name: 'iPhone 12 Pro', slug: 'iphone-12-pro' },
  { name: 'iPhone 12 Pro Max', slug: 'iphone-12-pro-max' },
  { name: 'iPhone 13', slug: 'iphone-13' },
  { name: 'iPhone 13 Mini', slug: 'iphone-13-mini' },
  { name: 'iPhone 13 Pro', slug: 'iphone-13-pro' },
  { name: 'iPhone 13 Pro Max', slug: 'iphone-13-pro-max' },
  { name: 'iPhone 14', slug: 'iphone-14' },
  { name: 'iPhone 14 Plus', slug: 'iphone-14-plus' },
  { name: 'iPhone 14 Pro', slug: 'iphone-14-pro' },
  { name: 'iPhone 14 Pro Max', slug: 'iphone-14-pro-max' },
  { name: 'iPhone 15', slug: 'iphone-15' },
  { name: 'iPhone 15 Plus', slug: 'iphone-15-plus' },
  { name: 'iPhone 15 Pro', slug: 'iphone-15-pro' },
  { name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max' },
  { name: 'iPhone 16', slug: 'iphone-16' },
  { name: 'iPhone 16 Plus', slug: 'iphone-16-plus' },
  { name: 'iPhone 16 Pro', slug: 'iphone-16-pro' },
  { name: 'iPhone 16 Pro Max', slug: 'iphone-16-pro-max' },
  { name: 'iPhone 16e', slug: 'iphone-16e' },
  // Android - Samsung
  { name: 'Samsung Galaxy S Series', slug: 'samsung-galaxy-s' },
  { name: 'Samsung Galaxy Note', slug: 'samsung-galaxy-note' },
  { name: 'Samsung Galaxy A Series', slug: 'samsung-galaxy-a' },
  { name: 'Samsung Galaxy Z Fold', slug: 'samsung-galaxy-z-fold' },
  { name: 'Samsung Galaxy Z Flip', slug: 'samsung-galaxy-z-flip' },
  { name: 'Samsung Galaxy M Series', slug: 'samsung-galaxy-m' },
  // Android - Xiaomi
  { name: 'Xiaomi Redmi', slug: 'xiaomi-redmi' },
  { name: 'Xiaomi Mi Series', slug: 'xiaomi-mi' },
  { name: 'Xiaomi POCO', slug: 'xiaomi-poco' },
  { name: 'Xiaomi Redmi Note', slug: 'xiaomi-redmi-note' },
  // Android - OnePlus
  { name: 'OnePlus', slug: 'oneplus' },
  { name: 'OnePlus Nord', slug: 'oneplus-nord' },
  // Android - Realme
  { name: 'Realme', slug: 'realme' },
  { name: 'Realme GT', slug: 'realme-gt' },
  { name: 'Realme Narzo', slug: 'realme-narzo' },
  // Android - Vivo
  { name: 'Vivo', slug: 'vivo' },
  { name: 'Vivo V Series', slug: 'vivo-v' },
  { name: 'Vivo Y Series', slug: 'vivo-y' },
  { name: 'Vivo X Series', slug: 'vivo-x' },
  // Android - Oppo
  { name: 'Oppo', slug: 'oppo' },
  { name: 'Oppo Reno', slug: 'oppo-reno' },
  { name: 'Oppo F Series', slug: 'oppo-f' },
  { name: 'Oppo A Series', slug: 'oppo-a' },
  // Android - Others
  { name: 'Motorola', slug: 'motorola' },
  { name: 'Nothing', slug: 'nothing' },
  { name: 'Google Pixel', slug: 'google-pixel' },
  { name: 'Nokia', slug: 'nokia' },
  { name: 'Infinix', slug: 'infinix' },
  { name: 'Tecno', slug: 'tecno' },
  { name: 'Lava', slug: 'lava' },
  { name: 'Micromax', slug: 'micromax' }
];

const seedCategories = async () => {
  try {
    // Force localhost connection - prevent accidental production database connection
    let mongoURI = process.env.MONGODB_URI;
    
    // If MONGODB_URI is not set, use localhost
    if (!mongoURI) {
      mongoURI = 'mongodb://localhost:27017/phoneclubs';
      console.log('⚠️  MONGODB_URI not set, using localhost default');
    }
    
    // Safety check: Warn if trying to connect to non-localhost
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
    
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in log
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!\n');

    // Clear existing categories
    console.log('🔄 Clearing existing categories...');
    const deleteResult = await Category.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing categories\n`);

    // Insert new categories
    console.log('🔄 Inserting categories...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Successfully seeded ${insertedCategories.length} categories:\n`);
    
    // List all inserted categories in groups
    console.log('📱 iPhone Categories:');
    const iphoneCategories = insertedCategories.filter(cat => cat.slug.startsWith('iphone-'));
    iphoneCategories.forEach((cat, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${cat.name.padEnd(30)} (${cat.slug})`);
    });
    
    console.log('\n🤖 Android Categories:');
    const androidCategories = insertedCategories.filter(cat => !cat.slug.startsWith('iphone-'));
    androidCategories.forEach((cat, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${cat.name.padEnd(30)} (${cat.slug})`);
    });

    console.log('\n✅ Categories are now available in the database!');
    console.log('✅ Users can now select these categories when posting ads.');
    console.log('✅ Frontend will display these categories in the dropdown.\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding categories:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check your MONGODB_URI in backend/.env file');
    console.error('   3. For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/phoneclubs');
    console.error('   4. For local MongoDB, make sure it\'s running on port 27017\n');
    process.exit(1);
  }
};

seedCategories();

