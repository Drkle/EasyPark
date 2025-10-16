// backend/src/db.js
import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';

mongoose.set('strictQuery', true); // ✅ seguro
// ⚠️ NO usar sanitizeFilter global: rompe operadores $gt/$lt en consultas válidas
// mongoose.set('sanitizeFilter', true); // ❌ quitar

export const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en variables de entorno');
  }
  await mongoose.connect(MONGODB_URI, {
    // Opcional: configura dbName si lo necesitas
    // dbName: 'easypark',
  });
  console.log('✅ MongoDB conectado');
};

export default mongoose;
