// backend/src/routes/auth.js
import { Router } from 'express';
import User from '../models/User.js';
import { JWT_SECRET } from '../config.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Utilidades locales
const isValidEmail = (value) =>
  typeof value === 'string' &&
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());


function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function signToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT secret not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (
      typeof name !== 'string' ||
      typeof password !== 'string' ||
      !isValidEmail(email)
    ) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const emailSafe = normalizeEmail(email);

    // 🔐 Mitigación S5147: usar where().equals() evita interpretación de operadores especiales
    const existing = await User.findOne()
      .where('email')
      .equals(emailSafe)
      .exec();

    if (existing)
      return res.status(400).json({ error: 'El correo ya está registrado' });

    const user = new User({
      name: name.trim(),
      email: emailSafe,
      role: role === 'admin' ? 'admin' : 'user'
    });
    await user.setPassword(password);
    await user.save();

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const emailSafe = normalizeEmail(email);

    // 🔐 Mitigación S5147: where().equals() para evitar NoSQL injection en consultas
    const user = await User.findOne()
      .where('email')
      .equals(emailSafe)
      .exec();

    if (!user || !(await user.validatePassword(password))) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
});

export default router;
