import { api, createAdmin, createUser, createSpot, rangeFuture } from './helpers.js';

describe('Reservations flow', () => {
  test('crear reserva válida, intento de colisión y cancelación', async () => {
    const { token:admin } = await createAdmin();
    const { token:user1 } = await createUser('r1@test.com');
    const { token:user2 } = await createUser('r2@test.com');

    const spot = await createSpot(admin, { name:'Flow', slotsCount:2, vehicleTypes:['car'] });
    const { start, end } = rangeFuture({ startMin:5, durationMin:60 });

    // Reserva válida
    const rsv = await api().post('/api/reservations')
      .set('Authorization', `Bearer ${user1}`)
      .send({ spotId: spot._id, slotCode:'A1', start, end, vehicleType:'car' })
      .expect(201);
    expect(rsv.body._id).toBeDefined();
    expect(rsv.body.status).toBe('active');

    // Colisión mismo slot y rango (otro usuario)
    const resCollision = await api().post('/api/reservations')
      .set('Authorization', `Bearer ${user2}`)
      .send({ spotId: spot._id, slotCode:'A1', start, end, vehicleType:'car' });
    expect(resCollision.status).toBeGreaterThanOrEqual(400); // 400/409 según tu handler
    expect(resCollision.body.error).toBeDefined();

    // Cancelar
    await api().post(`/api/reservations/${rsv.body._id}/cancel`)
      .set('Authorization', `Bearer ${user1}`)
      .expect(200);

    // Disponibilidad vuelve a plena
    const check = await api()
      .get(`/api/spots/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&vehicleType=car`)
      .set('Authorization', `Bearer ${user1}`)
      .expect(200);
    const row = check.body.find(s => s._id === spot._id);
    expect(row.availableCount).toBe(2);
  });

  test('mis reservas devuelve las del usuario autenticado', async () => {
    const { token:admin } = await createAdmin();
    const { token:user } = await createUser('mine@test.com');
    const spot = await createSpot(admin, { name:'Mine', slotsCount:2, vehicleTypes:['car'] });
    const { start, end } = rangeFuture();

    await api().post('/api/reservations')
      .set('Authorization', `Bearer ${user}`)
      .send({ spotId: spot._id, slotCode:'A1', start, end, vehicleType:'car' })
      .expect(201);

    const mine = await api().get('/api/reservations/mine')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    expect(Array.isArray(mine.body)).toBe(true);
    expect(mine.body.length).toBeGreaterThan(0);
    expect(mine.body[0].slotCode).toBeDefined();
  });
});
