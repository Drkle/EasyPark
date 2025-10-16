// backend/src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { PORT } from './config.js';
import { connectDB } from './db.js';

// Rutas API
import authRoutes from './routes/auth.js';
import spotsRoutes from './routes/spots.js';
import reservationsRoutes from './routes/reservations.js';
import statsRoutes from './routes/stats.js';
import usersRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* --------------------------- Middlewares base --------------------------- */
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: true,            // en producción coloca el dominio permitido
    credentials: false
  })
);

/* ------------------------------ Healthcheck ---------------------------- */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/* --------------------------------- API --------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/stats', statsRoutes);       // incluye /api/stats/stream (SSE)
app.use('/api/users', usersRoutes);

/* -------- Servir el frontend de React (build en frontend/dist) --------- */
const DIST_DIR = path.join(__dirname, '../../frontend/dist');
app.use(express.static(DIST_DIR));

// Fallback SPA: cualquier ruta que NO empiece por /api sirve index.html
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

/* --------------------------- Manejo de errores ------------------------- */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

/* ------------------- Levantar server SOLO fuera de test ---------------- */
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Servidor listo en http://localhost:${PORT}`)
    );
  });
}

export default app; // para testing
