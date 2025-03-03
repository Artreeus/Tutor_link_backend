import { Schema, model } from 'mongoose';
import { ISubject } from '../types/subject';

const SubjectSchema = new Schema<ISubject>({
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

export default model<ISubject>('Subject', SubjectSchema);