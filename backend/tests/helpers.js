import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import { JWT_SECRET } from '../src/config.js';
import User from '../src/models/User.js';

export function api() { return request(app); }

export async function createAdmin() {
  const u = new User({ name:'Admin', email:'admin@test.com', role:'admin' });
  await u.setPassword('secret');
  await u.save();
  const token = jwt.sign(
    { id:u._id.toString(), email:u.email, role:'admin', name:u.name },
    JWT_SECRET, { expiresIn: '1h' }
  );
  return { u, token };
}

export async function createUser(email='user@test.com') {
  const u = new User({ name:'User', email, role:'user' });
  await u.setPassword('secret');
  await u.save();
  const token = jwt.sign(
    { id:u._id.toString(), email:u.email, role:'user', name:u.name },
    JWT_SECRET, { expiresIn: '1h' }
  );
  return { u, token };
}

export async function createSpot(adminToken, {
  name='Central',
  location='Centro',
  hourlyRate=1000,
  vehicleTypes=['car'],
  slotsCount=3
} = {}) {
  const res = await api()
    .post('/api/spots')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name, location, hourlyRate, vehicleTypes, slotsCount });
  if (res.status >= 400) throw new Error(`createSpot failed: ${res.status} ${res.text}`);
  return res.body; // spot creado
}

export function futureISO(minutesFromNow=5) {
  return new Date(Date.now() + minutesFromNow*60*1000).toISOString();
}
export function rangeFuture({ startMin=5, durationMin=60 }={}) {
  const start = futureISO(startMin);
  const end   = futureISO(startMin + durationMin);
  return { start, end };
}
