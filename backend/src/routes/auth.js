import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../config.js';

const router = Router();

function signToken(user) {
  const payload = { id: user._id.toString(), email: user.email, role: user.role, name: user.name || '' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name = '', email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'El correo ya está registrado' });

    const user = new User({ name, email, role: role === 'admin' ? 'admin' : 'user' });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user);
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
    const ok = await user.validatePassword(password);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
});

export default router;
