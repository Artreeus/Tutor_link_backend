import { Document } from 'mongoose';
import { IUser } from './user';
import { ISubject } from './subject';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface IBooking extends Document {
  student: IUser['_id'];
  tutor: IUser['_id'];
  subject: ISubject['_id'];
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: BookingStatus;
  price: number;
  paymentStatus: 'pending' | 'paid';
  paymentIntentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}