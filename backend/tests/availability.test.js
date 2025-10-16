import { api, createAdmin, createUser, createSpot, rangeFuture } from './helpers.js';

describe('Availability - GET /api/spots/available', () => {
  test('sin reservas muestra todos los slots como disponibles', async () => {
    const { token:admin } = await createAdmin();
    const { token:user } = await createUser('avail1@test.com');

    const spot = await createSpot(admin, { name:'Disponibles', slotsCount:3, vehicleTypes:['car'] });

    const { start, end } = rangeFuture({ startMin:5, durationMin:60 });
    const res = await api()
      .get(`/api/spots/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&vehicleType=car`)
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    const row = res.body.find(s => s._id === spot._id);
    expect(row).toBeDefined();
    expect(row.availableCount).toBe(3);
    const reservedSlots = row.slots.filter(sl => sl.status === 'reserved').length;
    expect(reservedSlots).toBe(0);
  });

  test('una reserva marca 1 slot como reservado y decrementa availableCount', async () => {
    const { token:admin } = await createAdmin();
    const { token:user } = await createUser('avail2@test.com');

    const spot = await createSpot(admin, { name:'ConReserva', slotsCount:3, vehicleTypes:['car'] });
    const { start, end } = rangeFuture({ startMin:5, durationMin:60 });

    // crear reserva sobre A1
    await api()
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user}`)
      .send({ spotId: spot._id, slotCode: 'A1', start, end, vehicleType:'car' })
      .expect(201);

    const res2 = await api()
      .get(`/api/spots/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&vehicleType=car`)
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    const row2 = res2.body.find(s => s._id === spot._id);
    expect(row2.availableCount).toBe(2);
    const a1 = row2.slots.find(sl => sl.code === 'A1');
    expect(a1.status).toBe('reserved');
  });
});
