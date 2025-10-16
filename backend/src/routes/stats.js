import { Router } from 'express';
import ParkingSpot from '../models/ParkingSpot.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import { JWT_SECRET } from '../config.js';

const router = Router();

/** 
 * Construye el objeto de estadísticas en tiempo real 
 */
async function buildStatsPayload() {
  const now = new Date();

  // Solo reservas activas o vigentes (en curso)
  const activeReservations = await Reservation.find({
    status: 'active',
    start: { $lt: now },
    end: { $gt: now }
  }).populate('spotId', 'name location slots');

  // Calcular busySlots agrupando por spotId
  const busyBySpot = {};
  for (const r of activeReservations) {
    const k = r.spotId._id.toString();
    if (!busyBySpot[k]) busyBySpot[k] = new Set();
    busyBySpot[k].add(r.slotCode);
  }

  // Obtener parqueaderos activos
  const spots = await ParkingSpot.find({ active: true });

  // Detalle de cada parqueadero
  const details = spots.map(s => {
    const busy = busyBySpot[s._id]?.size ? busyBySpot[s._id] : new Set();
    const total = s.slots.length;
    const busyCount = busy.size;
    const freeCount = Math.max(0, total - busyCount);
    const busySlots = [...busy];

    return {
      id: s._id,
      name: s.name,
      location: s.location,
      totalSlots: total,
      busySlots: busyCount,
      freeSlots: freeCount,
      busySlotCodes: busySlots
    };
  });

  // Contadores globales
  const [activeSpots, totalUsers] = await Promise.all([
    ParkingSpot.countDocuments({ active: true }),
    User.countDocuments()
  ]);

  return {
    activeSpots,
    totalReservations: activeReservations.length, // ✅ Solo activas
    totalUsers,
    details
  };
}

/** RUTA NORMAL */
router.get('/', requireAuth, async (_req, res) => {
  try {
    const payload = await buildStatsPayload();
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

/** RUTA STREAM (SSE) */
router.get('/stream', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();

    // validar token JWT
    jwt.verify(token, JWT_SECRET);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let active = true;

    async function push() {
      if (!active) return;
      try {
        const data = await buildStatsPayload();
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        console.error('SSE push error:', e);
      }
    }

    push();
    const interval = setInterval(push, 5000);

    req.on('close', () => {
      active = false;
      clearInterval(interval);
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

export default router;
