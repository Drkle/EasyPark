// backend/tests/setupTestEnv.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo;

beforeAll(async () => {
  // Si tienes problemas de red con el binario, fija versión:
  // mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  // Conecta Mongoose al Mongo en memoria
  await mongoose.connect(uri, { dbName: 'jest' });
});

afterEach(async () => {
  // Limpia la DB completa entre tests (más rápido y estable que iterar colecciones)
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  // Cierra conexiones y apaga el servidor en memoria
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
});
