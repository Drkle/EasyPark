import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Intenta cargar el .env de la raíz del repo: parking-reservas/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 2) Además, carga (si existe) un .env local en backend/ para overrides
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

