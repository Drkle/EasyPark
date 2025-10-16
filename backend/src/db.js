import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';

export async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ Falta MONGODB_URI en .env');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  console.log('✅ Conectado a MongoDB');
}
