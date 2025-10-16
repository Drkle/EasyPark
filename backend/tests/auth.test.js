import { api } from './helpers.js';

describe('Auth', () => {
  test('register ok returns token', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Juan', email: 'juan@test.com', password: '123456' })
      .expect(200);
    expect(res.body.token).toBeDefined();
  });

  test('register duplicate email -> 400', async () => {
    await api().post('/api/auth/register').send({ name: 'A', email: 'dup@test.com', password: '123456' });
    const dup = await api().post('/api/auth/register').send({ name: 'B', email: 'dup@test.com', password: '123456' }).expect(400);
    expect(dup.body.error).toBeDefined();
  });

  test('login ok returns token', async () => {
    await api().post('/api/auth/register').send({ name: 'L', email: 'login@test.com', password: '123456' });
    const res = await api().post('/api/auth/login').send({ email: 'login@test.com', password: '123456' }).expect(200);
    expect(res.body.token).toBeDefined();
  });

  test('login invalid -> 400', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'no@test.com', password: 'wrong' }).expect(400);
    expect(res.body.error).toBeDefined();
  });
});
