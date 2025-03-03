const mongoose = require('mongoose');
const User = require('./User').User;

const ReviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    maxlength: [500, 'Comment cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Static method to calculate average rating for a tutor
ReviewSchema.statics.getAverageRating = async function(tutorId) {
  const obj = await this.aggregate([
    {
      $match: { tutor: tutorId }
    },
    {
      $group: {
        _id: '$tutor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj[0]) {
      await User.findByIdAndUpdate(tutorId, {
        averageRating: obj[0].averageRating.toFixed(1),
        totalReviews: obj[0].totalReviews
      });
    } else {
      await User.findByIdAndUpdate(tutorId, {
        averageRating: 0,
        totalReviews: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.tutor);
});

// Call getAverageRating after remove
ReviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.tutor);
});

module.exports = mongoose.model('Review', ReviewSchema);