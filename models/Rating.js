const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// One rating per buyer per listing
ratingSchema.index({ buyer: 1, listing: 1 }, { unique: true });
ratingSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);

