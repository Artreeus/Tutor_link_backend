import dotenv from 'dotenv';

// Load env vars
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb+srv://admin-um:admin1234@cluster0.d84zeas.mongodb.net/TutorLink?retryWrites=true&w=majority&appName=Cluster0",
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  nodeEnv: process.env.NODE_ENV || 'development',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || ''
};