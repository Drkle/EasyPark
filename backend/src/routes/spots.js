// backend/src/routes/spots.js
import { Router } from 'express';
import mongoose from 'mongoose';
import ParkingSpot from '../models/ParkingSpot.js';
import Reservation from '../models/Reservation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const { Types } = mongoose;

function isObjectId(v) {
  return typeof v === 'string' && Types.ObjectId.isValid(v);
}
function asObjectId(v) {
  return new Types.ObjectId(String(v));
}
function normStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}
const VEH_ALLOWED = new Set(['car', 'motorcycle', 'truck']);

// Sanea una lista de slots controlando formato y descartando basura
function sanitizeSlots(input, fallbackCount = 10) {
  const normCode = (c) => {
    const s = normStr(c).toUpperCase();
    // Permitir A1, B-12, etc. (letras/números/guion, 1-10 chars)
    return /^[A-Z0-9-]{1,10}$/.test(s) ? s : '';
  };

  let out = Array.isArray(input)
    ? input
        .map(it => ({ code: normCode(it?.code) }))
        .filter(it => it.code)
        .map(it => ({ code: it.code, status: 'available' }))
    : [];

  if (out.length === 0) {
    const n = Math.max(1, Math.min(200, Number(fallbackCount) || 10));
    out = Array.from({ length: n }, (_, i) => ({ code: `A${i + 1}`, status: 'available' }));
  }
  return out;
}

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
    } = req.body || {};

    const nameSafe = normStr(name);
    const locationSafe = normStr(location);
    if (!nameSafe || !locationSafe) {
      return res.status(400).json({ error: 'name y location son requeridos' });
    }

    // Lista blanca de tipos de vehículo
    const vtypes = Array.from(new Set((vehicleTypes || []).filter(Boolean)))
      .map(v => normStr(v).toLowerCase())
      .filter(v => VEH_ALLOWED.has(v));
    const finalVehicleTypes = vtypes.length ? vtypes : ['car', 'motorcycle'];

    const rate = Number.isFinite(Number(hourlyRate)) ? Number(hourlyRate) : 0;
    const activeFlag = Boolean(active);

    const finalSlots = sanitizeSlots(slots, slotsCount);

    // ⚠️ Construimos el documento explícitamente con valores saneados
    const spotDoc = new ParkingSpot({
      name: nameSafe,
      location: locationSafe,
      hourlyRate: rate,
      vehicleTypes: finalVehicleTypes,
      active: activeFlag,
      slots: finalSlots
    });

    const spot = await spotDoc.save();
    res.status(201).json(spot);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo crear el parqueadero' });
  }
});

// Listar spots (para cliente/admin). Si quieres solo activos, añade .where('active').equals(true)
router.get('/', requireAuth, async (_req, res) => {
  const spots = await ParkingSpot.find({}).sort({ createdAt: -1 }).exec();
  res.json(spots);
});

// Eliminar spot (solo admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!isObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const oid = asObjectId(id);

    const spot = await ParkingSpot.findOne().where('_id').equals(oid).exec();
    if (!spot) return res.status(404).json({ error: 'Parqueadero no encontrado' });

    // Validar que no tenga reservas activas en el futuro
    const hasFuture = await Reservation.exists()
      .where('spotId').equals(oid)
      .where('status').equals('active')
      .where('end').gt(new Date())
      .exec();

    if (hasFuture) return res.status(409).json({ error: 'No se puede eliminar: tiene reservas activas' });

    await ParkingSpot.deleteOne().where('_id').equals(oid).exec();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo eliminar el parqueadero' });
  }
});

// Disponibilidad por rango con slots
router.get('/available', requireAuth, async (req, res) => {
  try {
    const { start, end, vehicleType = 'car' } = req.query || {};
    if (!start || !end) return res.status(400).json({ error: 'start y end son requeridos' });

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!(startDate < endDate)) return res.status(400).json({ error: 'Rango horario inválido' });

    // Lista blanca para vehicleType y consulta segura
    const vt = normStr(vehicleType).toLowerCase();
    const vtSafe = VEH_ALLOWED.has(vt) ? vt : 'car';

    const spots = await ParkingSpot.find()
      .where('active').equals(true)
      .where('vehicleTypes').equals(vtSafe)
      .exec();

    const busyReservations = await Reservation.find()
      .where('status').equals('active')
      .where('start').lt(endDate)
      .where('end').gt(startDate)
      .select('spotId slotCode')
      .exec();

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
