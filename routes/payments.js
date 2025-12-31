const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createPaymentSession, verifyPayment, handleExpiredPayments } = require('../services/paymentService');
const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');
const { sendWinnerPaymentEmail, sendFeaturedListingPaymentEmail } = require('../services/emailService');

// Stripe webhook endpoint (must be before body parser middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const payment = await verifyPayment(session.id);
      
      if (payment && payment.status === 'completed') {
        // Handle featured listing payment
        if (payment.paymentType === 'featured_listing' && payment.listing) {
          const listing = await Listing.findById(payment.listing);
          if (listing) {
            listing.isFeatured = true;
            await listing.save();
          }
        }
        
        // Handle auction winner payment
        if (payment.paymentType === 'auction_winner' && payment.auction) {
          const auction = await Auction.findById(payment.auction);
          if (auction) {
            auction.paymentStatus = 'completed';
            auction.status = 'paid';
            auction.paymentCompletedAt = new Date();
            await auction.save();
            
            // Mark listing as sold
            const listing = await Listing.findById(auction.listing);
            if (listing) {
              listing.status = 'sold';
              await listing.save();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  res.json({ received: true });
});

// Create payment session for featured listing
router.post('/featured-listing', authenticateToken, async (req, res) => {
  try {
    const { listingId, amount } = req.body;

    if (!listingId || !amount) {
      return res.status(400).json({ error: 'Listing ID and amount are required' });
    }

    // Verify listing belongs to user
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only feature your own listings' });
    }

    // Check if user is seller
    const user = await User.findById(req.user.userId);
    if (user.userType !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can feature listings' });
    }

    // Set payment deadline (e.g., 7 days from now)
    const paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { payment, paymentLink } = await createPaymentSession({
      userId: req.user.userId,
      paymentType: 'featured_listing',
      amount: parseFloat(amount),
      listingId: listingId,
      paymentDeadline
    });

    // Send email notification
    await sendFeaturedListingPaymentEmail(
      user.email,
      user.name,
      listing.title,
      paymentLink
    ).catch(err => console.error('Failed to send featured listing email:', err));

    res.json({
      success: true,
      paymentId: payment._id,
      paymentLink,
      message: 'Payment session created successfully'
    });
  } catch (error) {
    console.error('Error creating featured listing payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment session for auction winner
router.post('/auction-winner', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    const auction = await Auction.findById(auctionId)
      .populate('listing')
      .populate('winner');

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Verify user is the winner
    if (auction.winner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not the winner of this auction' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      auction: auctionId,
      user: req.user.userId,
      status: { $in: ['pending', 'processing', 'completed'] }
    });

    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    if (existingPayment && existingPayment.status === 'pending') {
      return res.json({
        success: true,
        paymentId: existingPayment._id,
        paymentLink: existingPayment.paymentLink,
        message: 'Payment session already exists'
      });
    }

    // Set payment deadline (48 hours from now)
    const paymentDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const { payment, paymentLink } = await createPaymentSession({
      userId: req.user.userId,
      paymentType: 'auction_winner',
      amount: auction.currentPrice,
      auctionId: auctionId,
      paymentDeadline,
      isSecondBidder: auction.paymentStatus === 'second_bidder_pending'
    });

    res.json({
      success: true,
      paymentId: payment._id,
      paymentLink,
      message: 'Payment session created successfully'
    });
  } catch (error) {
    console.error('Error creating auction winner payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment status
router.get('/:paymentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('listing')
      .populate('auction')
      .populate('user');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify user owns this payment
    if (payment.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify payment manually (for frontend callback)
router.post('/verify/:paymentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (payment.stripeSessionId) {
      const verifiedPayment = await verifyPayment(payment.stripeSessionId);
      
      if (verifiedPayment && verifiedPayment.status === 'completed') {
        // Handle featured listing
        if (verifiedPayment.paymentType === 'featured_listing' && verifiedPayment.listing) {
          const listing = await Listing.findById(verifiedPayment.listing);
          if (listing) {
            listing.isFeatured = true;
            await listing.save();
          }
        }
        
        // Handle auction winner payment
        if (verifiedPayment.paymentType === 'auction_winner' && verifiedPayment.auction) {
          const auction = await Auction.findById(verifiedPayment.auction);
          if (auction) {
            auction.paymentStatus = 'completed';
            auction.status = 'paid';
            auction.paymentCompletedAt = new Date();
            await auction.save();
            
            const listing = await Listing.findById(auction.listing);
            if (listing) {
              listing.status = 'sold';
              await listing.save();
            }
          }
        }
      }

      return res.json(verifiedPayment);
    }

    res.json(payment);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to check and handle expired payments (can be called by cron job)
router.post('/check-expired', async (req, res) => {
  try {
    // This endpoint should be protected in production (e.g., with API key)
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.CRON_API_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = await handleExpiredPayments();
    res.json({
      success: true,
      message: 'Expired payments processed',
      results
    });
  } catch (error) {
    console.error('Error checking expired payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


