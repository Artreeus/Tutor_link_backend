import { Schema, model } from 'mongoose';
import { IBooking, BookingStatus } from '../types/booking';

const BookingSchema = new Schema<IBooking>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date for the booking']
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time']
  },
  duration: {
    type: Number,
    required: [true, 'Please add the duration in hours'],
    min: [0.5, 'Duration must be at least 30 minutes']
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING
  },
  price: {
    type: Number,
    required: [true, 'Please add the price for this booking']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

export default model<IBooking>('Booking', BookingSchema);