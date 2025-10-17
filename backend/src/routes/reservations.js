// backend/src/routes/reservations.js
import { Router } from 'express';
import mongoose from 'mongoose';
import Reservation from '../models/Reservation.js';
import ParkingSpot from '../models/ParkingSpot.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const { Types } = mongoose;

function isObjectId(value) {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

function asObjectId(value) {
  return new Types.ObjectId(String(value));
}

function normalizeSlotCode(v) {
  return typeof v === 'string' ? v.trim() : '';
}

const VEHICLE_TYPES = new Set(['car', 'moto', 'bike', 'van']);

// Crear reserva
router.post('/', requireAuth, async (req, res) => {
  try {
    const { spotId, slotCode, start, end } = req.body || {};
    let { vehicleType = 'car' } = req.body || {};

    if (!spotId || !start || !end) {
      return res.status(400).json({ error: 'spotId, start y end son requeridos' });
    }
    if (!isObjectId(spotId)) {
      return res.status(400).json({ error: 'spotId inválido' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!(startDate < endDate)) {
      return res.status(400).json({ error: 'Rango horario inválido' });
    }

    // lista blanca para vehicleType
    vehicleType = typeof vehicleType === 'string' ? vehicleType.trim().toLowerCase() : 'car';
    if (!VEHICLE_TYPES.has(vehicleType)) vehicleType = 'car';

    const spotObjId = asObjectId(spotId);

    // Buscar el parqueadero de forma segura (sin permitir operadores)
    const spot = await ParkingSpot.findOne().where('_id').equals(spotObjId).exec();
    if (!spot || !spot.active) {
      return res.status(404).json({ error: 'Parqueadero no encontrado' });
    }
    if (!spot.vehicleTypes.includes(vehicleType)) {
      return res.status(400).json({ error: 'Tipo de vehículo no permitido en este parqueadero' });
    }

    // Slots ocupados en el rango — consulta segura con where().equals()
    const busy = await Reservation.find()
      .where('spotId').equals(spotObjId)
      .where('status').equals('active')
      .where('start').lt(endDate)
      .where('end').gt(startDate)
      .select('slotCode')
      .exec();

    const busySet = new Set(busy.map(b => b.slotCode));

    // Slot recibido
    let chosenSlot = normalizeSlotCode(slotCode);

    // Si no llega slotCode, elegir el primer slot libre automáticamente
    if (!chosenSlot) {
      const firstFree = spot.slots.find(s => !busySet.has(s.code));
      if (!firstFree) {
        return res.status(409).json({ error: 'No hay slots disponibles en ese rango' });
      }
      chosenSlot = firstFree.code;
    } else {
      // Validar que exista el slot
      const exists = spot.slots.some(s => s.code === chosenSlot);
      if (!exists) {
        return res.status(400).json({ error: 'El slot indicado no existe' });
      }
      // Validar que esté libre
      if (busySet.has(chosenSlot)) {
        return res.status(409).json({ error: 'Ese slot ya está reservado en ese rango' });
      }
    }

    const reservation = await Reservation.create({
      userId: asObjectId(req.user.id),
      spotId: spotObjId,
      slotCode: chosenSlot,
      vehicleType,
      start: startDate,
      end: endDate
    });

    res.status(201).json(reservation);
  } catch (e) {
    console.error('Create reservation error:', e);
    return res.status(500).json({ error: 'No se pudo crear la reserva' });
  }
});

// Mis reservas
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const list = await Reservation.find()
      .where('userId').equals(asObjectId(req.user.id))
      .sort({ start: -1 })
      .populate('spotId', 'name location')
      .exec();

    res.json(list);
  } catch (e) {
    console.error('List reservations error:', e);
    res.status(500).json({ error: 'Error listando reservas' });
  }
});

// Cancelar mi reserva
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!isObjectId(id)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const r = await Reservation.findOne()
      .where('_id').equals(asObjectId(id))
      .where('userId').equals(asObjectId(req.user.id))
      .exec();

    if (!r) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (r.status === 'cancelled') return res.json({ ok: true }); // idempotente

    r.status = 'cancelled';
    await r.save();
    res.json({ ok: true });
  } catch (e) {
    console.error('Cancel reservation error:', e);
    res.status(500).json({ error: 'No se pudo cancelar la reserva' });
  }
});

export default router;

