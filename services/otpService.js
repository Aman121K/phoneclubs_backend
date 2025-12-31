// OTP Service for phone verification
// Supports multiple providers: Twilio, MSG91, or TextLocal

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
const sendOTP = async (phoneNumber) => {
  try {
    const otp = generateOTP();
    
    // Store OTP in database with expiration (5 minutes)
    const User = require('../models/User');
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      throw new Error('User not found with this phone number');
    }
    
    user.phoneVerificationCode = otp;
    user.phoneVerificationExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();
    
    // Try Twilio first
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: `Your PhoneClubs verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${phoneNumber}` // Assuming Indian numbers
      });
    }
    // Try MSG91
    else if (process.env.MSG91_AUTH_KEY) {
      const axios = require('axios');
      await axios.get('https://control.msg91.com/api/sendotp.php', {
        params: {
          authkey: process.env.MSG91_AUTH_KEY,
          mobile: `91${phoneNumber}`,
          message: `Your PhoneClubs verification code is ${otp}. Valid for 5 minutes.`,
          sender: process.env.MSG91_SENDER_ID || 'PHNHUB',
          otp: otp
        }
      });
    }
    // Try TextLocal
    else if (process.env.TEXTLOCAL_API_KEY) {
      const axios = require('axios');
      await axios.post('https://api.textlocal.in/send/', null, {
        params: {
          apikey: process.env.TEXTLOCAL_API_KEY,
          numbers: `91${phoneNumber}`,
          message: `Your PhoneClubs verification code is: ${otp}. Valid for 5 minutes.`,
          sender: process.env.TEXTLOCAL_SENDER_ID || 'TXTLCL'
        }
      });
    }
    // Fallback: Log OTP (for development)
    else {
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
    }
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

// Verify OTP
const verifyOTP = async (phoneNumber, otp) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.phoneVerificationCode) {
      throw new Error('No OTP found. Please request a new OTP.');
    }
    
    if (user.phoneVerificationExpires < new Date()) {
      throw new Error('OTP has expired. Please request a new OTP.');
    }
    
    if (user.phoneVerificationCode !== otp) {
      throw new Error('Invalid OTP');
    }
    
    // Mark phone as verified
    user.phoneVerified = true;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpires = null;
    await user.save();
    
    return { success: true, message: 'Phone verified successfully' };
  } catch (error) {
    throw error;
  }
};

module.exports = { sendOTP, verifyOTP };

