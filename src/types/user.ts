import { Document } from 'mongoose';

export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  bio?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  subjects?: string[];
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
    }[];
  }[];
  hourlyRate?: number;
  averageRating?: number;
  totalReviews?: number;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

export interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

export interface UserRequest extends Express.Request {
  user?: IUser;
}