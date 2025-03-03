import { Document } from 'mongoose';
import { IUser } from './user';
import { IBooking } from './booking';

export interface IReview extends Document {
  student: IUser['_id'];
  tutor: IUser['_id'];
  booking: IBooking['_id'];
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}