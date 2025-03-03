const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  gradeLevel: {
    type: String,
    required: [true, 'Please add a grade level'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Math', 'Science', 'Language', 'History', 'Arts', 'Technology', 'Other']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', SubjectSchema);