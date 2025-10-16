import { api, createAdmin, createUser, createSpot } from './helpers.js';

describe('Spots CRUD (admin)', () => {
  test('admin crea spot con slots autogenerados y aparece en el listado', async () => {
    const { token:admin } = await createAdmin();

    const spot = await createSpot(admin, {
      name: 'Norte',
      location: 'Av 80',
      hourlyRate: 1500,
      vehicleTypes: ['car', 'motorcycle'],
      slotsCount: 5
    });
    expect(spot._id).toBeDefined();
    expect(Array.isArray(spot.slots)).toBe(true);
    expect(spot.slots.length).toBe(5);

    // listado visible para user autenticado
    const { token:user } = await createUser('u.spots@test.com');
    const list = await api().get('/api/spots')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);
    const ids = list.body.map(s => s._id);
    expect(ids).toContain(spot._id);
  });

  test('admin elimina spot y ya no aparece en el listado', async () => {
    const { token:admin } = await createAdmin();
    const { token:user } = await createUser('u.spots2@test.com');

    const spot = await createSpot(admin, { name:'Sur', slotsCount:2 });

    await api().delete(`/api/spots/${spot._id}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);

    const list2 = await api().get('/api/spots')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);
    const ids2 = list2.body.map(s => s._id);
    expect(ids2).not.toContain(spot._id);
  });
});
