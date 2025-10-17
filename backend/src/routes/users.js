// backend/src/routes/users.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();
const { Types } = mongoose;

function isObjectId(v) {
  return typeof v === 'string' && Types.ObjectId.isValid(v);
}
function asObjectId(v) {
  return new Types.ObjectId(String(v));
}

// Listar usuarios (básico)
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find({}, 'name email role createdAt')
    .sort({ createdAt: -1 })
    .exec();
  res.json(users);
});

// Eliminar usuario
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params || {};
  if (!isObjectId(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const oid = asObjectId(id);

  // Busca el usuario de forma segura
  const u = await User.findOne().where('_id').equals(oid).exec();
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Eliminación segura
  await User.deleteOne().where('_id').equals(oid).exec();

  res.json({ ok: true });
});

export default router;
