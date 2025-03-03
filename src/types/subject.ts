import { Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  gradeLevel: string;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}