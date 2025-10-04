const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  nationality: {
    type: String,
    index: true
  },
  residency: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  phone: {
    countryCode: String,
    number: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  profilePicture: String,
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true
});

// Indexes
userProfileSchema.index({ 'address.coordinates': '2dsphere' });
userProfileSchema.index({ nationality: 1 });

// Virtual for full name
userProfileSchema.virtual('displayName').get(function() {
  if (this.fullName) return this.fullName;
  if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
  return this.firstName || 'Unknown';
});

module.exports = mongoose.model('UserProfile', userProfileSchema);

