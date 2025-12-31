const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  deviceToken: {
    type: String,
    default: null,
    index: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique views per listing per user/device
// Note: We'll handle uniqueness in the application logic since MongoDB
// doesn't support multiple unique indexes with different partial filters well
viewSchema.index({ listing: 1, user: 1 });
viewSchema.index({ listing: 1, deviceToken: 1 });

// Index for efficient counting
viewSchema.index({ listing: 1, viewedAt: -1 });

module.exports = mongoose.model('View', viewSchema);

