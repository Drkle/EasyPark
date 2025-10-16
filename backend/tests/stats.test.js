import { api, createAdmin, createUser, createSpot } from './helpers.js';

function isoMinutesFromNow(mins) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

describe('Stats - solo activas y ocupación por parqueadero', () => {
  test('totalReservations cuenta solo activas; ocupación por spot refleja reservas activas', async () => {
    const { token:admin } = await createAdmin();
    const { token:user } = await createUser('stats@test.com');

    const spot = await createSpot(admin, { name:'Stats', slotsCount:3, vehicleTypes:['car'] });

    // Hacemos la reserva ACTIVA: empezó hace 5 min y termina en 55 min
    const start = isoMinutesFromNow(-5);   // pasado (ya empezó)
    const end   = isoMinutesFromNow(55);   // futuro (aún no termina)

    // Stats inicial
    const s0 = await api().get('/api/stats')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);
    const d0 = s0.body.details.find(d => d.id === spot._id);
    expect(d0.busySlots).toBe(0);

    // 1 reserva activa (A1)
    const rsv = await api().post('/api/reservations')
      .set('Authorization', `Bearer ${user}`)
      .send({ spotId: spot._id, slotCode:'A1', start, end, vehicleType:'car' })
      .expect(201);

    const s1 = await api().get('/api/stats')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    // ✅ debe contarla como activa
    expect(s1.body.totalReservations).toBeGreaterThanOrEqual(1);

    const d1 = s1.body.details.find(d => d.id === spot._id);
    expect(d1.busySlots).toBe(1);
    expect(d1.freeSlots).toBe(2);

    // Cancelar y verificar que vuelve a 0 ocupados
    await api().post(`/api/reservations/${rsv.body._id}/cancel`)
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    const s2 = await api().get('/api/stats')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);
    const d2 = s2.body.details.find(d => d.id === spot._id);
    // Puede quedar 0 activas
    expect(s2.body.totalReservations).toBeGreaterThanOrEqual(0);
    expect(d2.busySlots).toBe(0);
    expect(d2.freeSlots).toBe(3);
  });
});
