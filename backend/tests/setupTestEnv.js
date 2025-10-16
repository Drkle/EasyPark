// backend/tests/setupTestEnv.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// 👉 Secretos para entorno de pruebas
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-please-change';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.local';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { dbName: 'jest' });
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
});
