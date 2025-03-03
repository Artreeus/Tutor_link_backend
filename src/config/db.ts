import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin-um:admin1234@cluster0.d84zeas.mongodb.net/TutorLink?retryWrites=true&w=majority&appName=Cluster0");
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;