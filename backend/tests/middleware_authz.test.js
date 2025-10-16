import { api, createAdmin, createUser } from './helpers.js';

describe('Auth middleware / access control', () => {
  test('GET /api/spots sin token -> 401', async () => {
    await api().get('/api/spots').expect(401);
  });

  test('GET /api/spots con token de usuario -> 200', async () => {
    const { token } = await createUser('u1@test.com');
    await api().get('/api/spots').set('Authorization', `Bearer ${token}`).expect(200);
  });

  test('POST /api/spots con token de usuario -> 403', async () => {
    const { token } = await createUser('u2@test.com');
    const res = await api()
      .post('/api/spots')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', location: 'Y', hourlyRate: 1000, vehicleTypes: ['car'], slotsCount: 2 })
      .expect(403);
    expect(res.body.error || res.body.message).toBeDefined();
  });

  test('POST /api/spots con token de admin -> 201', async () => {
    const { token } = await createAdmin();
    const res = await api()
      .post('/api/spots')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Central', location: 'Centro', hourlyRate: 1200, vehicleTypes: ['car','motorcycle'], slotsCount: 4 })
      .expect(201);
    expect(res.body._id).toBeDefined();
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBe(4);
  });
});
