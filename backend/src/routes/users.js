import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

// Listar usuarios (básico)
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 });
  res.json(users);
});

// Eliminar usuario
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const u = await User.findById(id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  await User.deleteOne({ _id: id });
  res.json({ ok: true });
});

export default router;
