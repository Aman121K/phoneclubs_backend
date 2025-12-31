const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

// Subscribe to email notifications
router.post('/subscribe', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    let subscription = await Subscription.findOne({ email: normalizedEmail });

    if (subscription) {
      if (subscription.isActive) {
        return res.status(200).json({ 
          message: 'You are already subscribed to our newsletter',
          subscribed: true 
        });
      } else {
        // Reactivate subscription
        subscription.isActive = true;
        subscription.subscribedAt = new Date();
        subscription.unsubscribedAt = null;
        subscription.unsubscribeToken = crypto.randomBytes(32).toString('hex');
        await subscription.save();
        return res.status(200).json({ 
          message: 'Welcome back! You have been resubscribed to our newsletter',
          subscribed: true 
        });
      }
    }

    // Create new subscription
    subscription = new Subscription({
      email: normalizedEmail,
      unsubscribeToken: crypto.randomBytes(32).toString('hex')
    });

    await subscription.save();

    res.status(201).json({ 
      message: 'Successfully subscribed! You will receive notifications about new listings.',
      subscribed: true 
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error.code === 11000) {
      return res.status(200).json({ 
        message: 'You are already subscribed',
        subscribed: true 
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsubscribe from email notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscription = await Subscription.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Email not found in our subscription list' });
    }

    if (!subscription.isActive) {
      return res.status(200).json({ message: 'You are already unsubscribed' });
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.status(200).json({ message: 'Successfully unsubscribed from notifications' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subscription status (for checking if email is subscribed)
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const subscription = await Subscription.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!subscription) {
      return res.json({ subscribed: false });
    }

    res.json({ 
      subscribed: subscription.isActive,
      subscribedAt: subscription.subscribedAt
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

