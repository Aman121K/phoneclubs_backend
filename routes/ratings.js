const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Create rating
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sellerId, listingId, rating, review } = req.body;
    
    if (!listingId || !rating) {
      return res.status(400).json({ error: 'Listing ID and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Get listing to find seller
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Verify buyer didn't rate this listing before
    const existingRating = await Rating.findOne({
      buyer: req.user.userId,
      listing: listingId
    });
    
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this listing' });
    }
    
    // Verify buyer is not rating their own listing
    if (listing.user.toString() === req.user.userId) {
      return res.status(400).json({ error: 'You cannot rate your own listing' });
    }
    
    const newRating = new Rating({
      seller: listing.user,
      buyer: req.user.userId,
      listing: listingId,
      rating: parseInt(rating),
      review: review || ''
    });
    
    await newRating.save();
    
    // Calculate and update seller's average rating (optional - can be done on the fly)
    
    res.json({ 
      message: 'Rating submitted successfully', 
      rating: {
        _id: newRating._id,
        id: newRating._id,
        seller: newRating.seller,
        buyer: newRating.buyer,
        listing: newRating.listing,
        rating: newRating.rating,
        review: newRating.review,
        createdAt: newRating.createdAt
      }
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get seller ratings
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const ratings = await Rating.find({ seller: req.params.sellerId })
      .populate('buyer', 'name')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    // Format response
    const formattedRatings = ratings.map(rating => ({
      _id: rating._id,
      id: rating._id,
      rating: rating.rating,
      review: rating.review,
      buyer: rating.buyer ? {
        _id: rating.buyer._id,
        name: rating.buyer.name
      } : null,
      listing: rating.listing ? {
        _id: rating.listing._id,
        title: rating.listing.title
      } : null,
      createdAt: rating.createdAt
    }));
    
    res.json({
      ratings: formattedRatings,
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rating for a specific listing
router.get('/listing/:listingId', async (req, res) => {
  try {
    const rating = await Rating.findOne({ listing: req.params.listingId })
      .populate('buyer', 'name')
      .populate('seller', 'name');
    
    if (!rating) {
      return res.json({ rating: null });
    }
    
    res.json({
      rating: {
        _id: rating._id,
        id: rating._id,
        rating: rating.rating,
        review: rating.review,
        buyer: rating.buyer ? {
          _id: rating.buyer._id,
          name: rating.buyer.name
        } : null,
        seller: rating.seller ? {
          _id: rating.seller._id,
          name: rating.seller.name
        } : null,
        createdAt: rating.createdAt
      }
    });
  } catch (error) {
    console.error('Get listing rating error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's ratings (ratings given by user)
router.get('/my-ratings', authenticateToken, async (req, res) => {
  try {
    const ratings = await Rating.find({ buyer: req.user.userId })
      .populate('seller', 'name')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    
    const formattedRatings = ratings.map(rating => ({
      _id: rating._id,
      id: rating._id,
      rating: rating.rating,
      review: rating.review,
      seller: rating.seller ? {
        _id: rating.seller._id,
        name: rating.seller.name
      } : null,
      listing: rating.listing ? {
        _id: rating.listing._id,
        title: rating.listing.title
      } : null,
      createdAt: rating.createdAt
    }));
    
    res.json({ ratings: formattedRatings });
  } catch (error) {
    console.error('Get my ratings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

