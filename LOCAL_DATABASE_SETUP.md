# Local Database Setup Guide

## ⚠️ IMPORTANT: Localhost Only

This project is configured to **ONLY connect to your local MongoDB database** for safety. It will **NOT** connect to any production or remote databases in development mode.

## Database Configuration

### Default Connection
- **Host**: `localhost` (127.0.0.1)
- **Port**: `27017` (MongoDB default)
- **Database**: `phoneclubs`

### Connection String Format
```
mongodb://localhost:27017/phoneclubs
```

## Setup Instructions

### 1. Install MongoDB Locally

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Create .env File

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

### 3. Configure .env File

Edit `backend/.env` and set:

```env
# Local MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/phoneclubs

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change this!)
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

### 4. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Or check the service status
brew services list  # macOS
sudo systemctl status mongodb  # Linux
```

### 5. Test Connection

```bash
cd backend
node scripts/seedCategories.js
```

You should see:
```
✅ MongoDB Connected: localhost:27017
✅ Confirmed: Connected to LOCAL database
```

## Safety Features

### Automatic Localhost Protection

The application includes safety checks that:

1. **Default to localhost** if `MONGODB_URI` is not set
2. **Warn you** if trying to connect to non-localhost in development
3. **Force localhost** in development mode (unless `FORCE_LOCALHOST=false`)

### Warning Messages

If you accidentally try to connect to a production database, you'll see:

```
⚠️  WARNING: Attempting to connect to non-localhost database!
⚠️  This might be a production database. Please check your MONGODB_URI.
⚠️  For localhost, use: mongodb://localhost:27017/phoneclubs
🛡️  Forcing localhost connection for safety...
```

## Troubleshooting

### MongoDB Not Running

**Error**: `Error connecting to MongoDB: connect ECONNREFUSED`

**Solution**:
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongodb  # Linux
```

### Wrong Port

**Error**: `Error connecting to MongoDB: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**: Check if MongoDB is running on a different port:
```bash
# Check MongoDB port
mongosh --eval "db.serverStatus().process"
```

If using a different port (e.g., 27018), update `.env`:
```env
MONGODB_URI=mongodb://localhost:27018/phoneclubs
```

### Database Doesn't Exist

MongoDB will automatically create the `phoneclubs` database when you first connect. No manual creation needed!

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production` in your production environment
2. Set your production `MONGODB_URI` in production environment variables
3. The safety checks will be bypassed in production mode

**⚠️ NEVER commit production database URLs to git!**

## Quick Start

```bash
# 1. Start MongoDB (if not running)
brew services start mongodb-community  # macOS

# 2. Create .env file
cd backend
echo "MONGODB_URI=mongodb://localhost:27017/phoneclubs" > .env
echo "PORT=5000" >> .env
echo "NODE_ENV=development" >> .env
echo "JWT_SECRET=your_secret_key_here" >> .env

# 3. Seed categories
node scripts/seedCategories.js

# 4. Start server
npm run dev
```

## Verification

After setup, verify your connection:

```bash
# Check connection
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phoneclubs').then(() => { console.log('✅ Connected to:', mongoose.connection.host); process.exit(0); });"
```

You should see:
```
✅ Connected to: localhost:27017
```

---

**Remember**: This project is configured to ONLY use localhost MongoDB for your safety! 🛡️

