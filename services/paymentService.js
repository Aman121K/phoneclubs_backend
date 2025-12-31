const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const Payment = require('../models/Payment');

/**
 * Create a Stripe Checkout Session for payment
 * @param {Object} params - Payment parameters
 * @param {String} params.userId - User ID
 * @param {String} params.paymentType - 'featured_listing' or 'auction_winner'
 * @param {Number} params.amount - Amount in AED (will be converted to fils)
 * @param {String} params.listingId - Listing ID (for featured listing)
 * @param {String} params.auctionId - Auction ID (for auction winner)
 * @param {Date} params.paymentDeadline - Payment deadline
 * @param {Boolean} params.isSecondBidder - Whether this is second bidder payment
 * @returns {Object} Payment object and Stripe session
 */
const createPaymentSession = async (params) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
    }

    const { userId, paymentType, amount, listingId, auctionId, paymentDeadline, isSecondBidder = false } = params;

    // Convert AED to fils (smallest currency unit for Stripe)
    // 1 AED = 100 fils
    const amountInFils = Math.round(amount * 100);

    // Create payment record
    const payment = new Payment({
      user: userId,
      paymentType,
      listing: listingId || null,
      auction: auctionId || null,
      amount,
      currency: 'AED',
      status: 'pending',
      paymentDeadline,
      isSecondBidder
    });
    await payment.save();

    // Determine success and cancel URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let successUrl, cancelUrl, metadata = {};

    if (paymentType === 'featured_listing') {
      successUrl = `${baseUrl}/payment/success?payment_id=${payment._id}`;
      cancelUrl = `${baseUrl}/post-ad?payment_cancelled=true`;
      metadata = {
        paymentId: payment._id.toString(),
        paymentType: 'featured_listing',
        listingId: listingId
      };
    } else if (paymentType === 'auction_winner') {
      successUrl = `${baseUrl}/payment/success?payment_id=${payment._id}`;
      cancelUrl = `${baseUrl}/auction/${auctionId}?payment_cancelled=true`;
      metadata = {
        paymentId: payment._id.toString(),
        paymentType: 'auction_winner',
        auctionId: auctionId,
        isSecondBidder: isSecondBidder.toString()
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aed',
            product_data: {
              name: paymentType === 'featured_listing' 
                ? 'Featured Listing Payment' 
                : 'Auction Winner Payment',
              description: paymentType === 'featured_listing'
                ? 'Payment to feature your listing at the top'
                : `Payment for winning auction bid${isSecondBidder ? ' (Second Bidder)' : ''}`,
            },
            unit_amount: amountInFils,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: payment._id.toString(),
      metadata: metadata,
      expires_at: Math.floor(paymentDeadline.getTime() / 1000), // Stripe expects Unix timestamp
    });

    // Update payment with Stripe session ID
    payment.stripeSessionId = session.id;
    payment.paymentLink = session.url;
    await payment.save();

    return {
      payment,
      session,
      paymentLink: session.url
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
};

/**
 * Verify payment completion from Stripe webhook
 * @param {String} sessionId - Stripe session ID
 * @returns {Object} Updated payment object
 */
const verifyPayment = async (sessionId) => {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ stripeSessionId: sessionId });
      
      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (payment.status === 'completed') {
        return payment; // Already processed
      }

      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.stripePaymentIntentId = session.payment_intent;
      await payment.save();

      return payment;
    }

    return null;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Check and handle expired payments
 * @returns {Object} Summary of expired payments handled
 */
const handleExpiredPayments = async () => {
  try {
    const now = new Date();
    
    // Find expired pending payments
    const expiredPayments = await Payment.find({
      status: 'pending',
      paymentDeadline: { $lt: now }
    }).populate('user').populate('auction');

    const results = {
      blocked: 0,
      secondBidderNotified: 0,
      errors: []
    };

    for (const payment of expiredPayments) {
      try {
        if (payment.paymentType === 'auction_winner') {
          // Block the user for lifetime
          const User = require('../models/User');
          const user = await User.findById(payment.user._id);
          if (user) {
            user.status = 'blocked';
            await user.save();
            results.blocked++;
          }

          // Update payment status
          payment.status = 'expired';
          await payment.save();

          // If this was first winner, notify second bidder
          if (!payment.isSecondBidder && payment.auction) {
            const Auction = require('../models/Auction');
            const Listing = require('../models/Listing');
            const auction = await Auction.findById(payment.auction._id || payment.auction)
              .populate('listing');
            
            if (auction && auction.secondBidder) {
              // Create payment for second bidder
              const secondBidderId = auction.secondBidder._id || auction.secondBidder;
              const secondBidderPayment = await createPaymentSession({
                userId: secondBidderId.toString(),
                paymentType: 'auction_winner',
                amount: auction.currentPrice,
                auctionId: auction._id.toString(),
                paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
                isSecondBidder: true
              });

              // Update auction
              auction.paymentStatus = 'second_bidder_pending';
              auction.winner = secondBidderId;
              await auction.save();

              // Send email to second bidder
              const { sendSecondBidderPaymentEmail } = require('./emailService');
              const secondBidder = await User.findById(secondBidderId);
              if (secondBidder) {
                const listing = await Listing.findById(auction.listing?._id || auction.listing);
                await sendSecondBidderPaymentEmail(
                  secondBidder.email,
                  secondBidder.name,
                  listing ? listing.title : 'Auction Item',
                  auction.currentPrice,
                  secondBidderPayment.paymentLink
                );
              }

              results.secondBidderNotified++;
            }
          }
        } else if (payment.paymentType === 'featured_listing') {
          // Just mark as expired for featured listings
          payment.status = 'expired';
          await payment.save();
        }
      } catch (error) {
        console.error(`Error handling expired payment ${payment._id}:`, error);
        results.errors.push({ paymentId: payment._id, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error handling expired payments:', error);
    throw error;
  }
};

module.exports = {
  createPaymentSession,
  verifyPayment,
  handleExpiredPayments
};

