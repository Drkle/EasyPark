import { Router } from 'express';
import ParkingSpot from '../models/ParkingSpot.js';
import Reservation from '../models/Reservation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Admin: crear spot (con slots auto)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      location,
      hourlyRate = 0,
      vehicleTypes = [],
      active = true,
      slotsCount = 10,
      slots = []
    } = req.body;

    if (!name || !location) return res.status(400).json({ error: 'name y location son requeridos' });

    const vtypes = Array.from(new Set((vehicleTypes || []).filter(Boolean)));
    const allowed = ['car', 'motorcycle', 'truck'];
    const filtered = vtypes.filter(v => allowed.includes(v));
    const finalVehicleTypes = filtered.length ? filtered : ['car', 'motorcycle'];

    let finalSlots = slots;
    if (!finalSlots?.length) {
      const n = Math.max(1, Math.min(200, Number(slotsCount) || 10));
      finalSlots = Array.from({ length: n }, (_, i) => ({ code: `A${i + 1}`, status: 'available' }));
    }

    const spot = await ParkingSpot.create({
      name,
      location,
      hourlyRate,
      vehicleTypes: finalVehicleTypes,
      active,
      slots: finalSlots
    });

    res.status(201).json(spot);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el parqueadero' });
  }
});

// Listar spots activos (para cliente/admin)
router.get('/', requireAuth, async (_req, res) => {
  const spots = await ParkingSpot.find({}).sort({ createdAt: -1 }); // <- todos; el cliente puede filtrar por active
  res.json(spots);
});

// Eliminar spot (solo admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const spot = await ParkingSpot.findById(id);
    if (!spot) return res.status(404).json({ error: 'Parqueadero no encontrado' });

    // Opcional: validar que no tenga reservas activas en el futuro
    const hasFuture = await Reservation.exists({
      spotId: id,
      status: 'active',
      end: { $gt: new Date() }
    });
    if (hasFuture) return res.status(409).json({ error: 'No se puede eliminar: tiene reservas activas' });

    await ParkingSpot.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar el parqueadero' });
  }
});

// Disponibilidad por rango con slots
router.get('/available', requireAuth, async (req, res) => {
  try {
    const { start, end, vehicleType = 'car' } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start y end son requeridos' });

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!(startDate < endDate)) return res.status(400).json({ error: 'Rango horario inválido' });

    const spots = await ParkingSpot.find({ active: true, vehicleTypes: vehicleType });

    const busyReservations = await Reservation.find({
      status: 'active',
      start: { $lt: endDate },
      end: { $gt: startDate }
    }).select('spotId slotCode');

    const busyMap = {};
    busyReservations.forEach(r => {
      const key = r.spotId.toString();
      if (!busyMap[key]) busyMap[key] = new Set();
      busyMap[key].add(r.slotCode);
    });

    const data = spots.map(s => {
      const busySlots = busyMap[s._id]?.size ? busyMap[s._id] : new Set();
      const availableSlots = s.slots.filter(sl => !busySlots.has(sl.code));
      return {
        _id: s._id,
        name: s.name,
        location: s.location,
        hourlyRate: s.hourlyRate,
        vehicleTypes: s.vehicleTypes,
        slots: s.slots.map(sl => ({
          code: sl.code,
          status: busySlots.has(sl.code) ? 'reserved' : 'available'
        })),
        availableCount: availableSlots.length,
        active: s.active
      };
    });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando disponibilidad' });
  }
});

export default router;
