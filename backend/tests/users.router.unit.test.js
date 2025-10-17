// backend/tests/users.router.unit.test.js
import { jest } from '@jest/globals';

// Evita levantar MongoMemoryServer en tu setup, si lo tienes
process.env.SKIP_DB_SETUP = '1';

// Mockea cualquier conexión automática
jest.unstable_mockModule('../src/db.js', () => ({ default: {} }));

// Middlewares: dejan pasar siempre
jest.unstable_mockModule('../src/middleware/auth.js', () => ({
  requireAuth: () => (_req, _res, next) => next(),
  requireAdmin: () => (_req, _res, next) => next(),
}));

// Datos base que devolverá el mock
const usersData = [
  { _id: '507f1f77bcf86cd799439011', name: 'Ana', email: 'ana@x.com', role: 'user', createdAt: new Date() },
  { _id: '507f1f77bcf86cd799439012', name: 'Bob', email: 'bob@x.com', role: 'admin', createdAt: new Date() },
];

// Helper: objeto encadenable tipo Mongoose para findOne() y compañía
const makeChain = (result) => ({
  where() { return this; },
  equals() { return this; },
  sort() { return this; },
  exec: () => Promise.resolve(result),
});

// Mock del modelo User *con cadenas encadenables y exec()*
const mockUserModel = {
  // GET /  =>  User.find({..}).sort(...).exec()
  find: jest.fn(() => makeChain(usersData)),

  // DELETE /:id  =>  User.findOne().where('_id').equals(oid).exec()
  // por defecto NONE (null). En el test "OK" lo sobreescribimos a un usuario.
  findOne: jest.fn(() => makeChain(null)),

  // Y luego deleteOne({ _id: id })
  deleteOne: jest.fn(() => makeChain({ deletedCount: 1 })),
};

jest.unstable_mockModule('../src/models/User.js', () => ({ default: mockUserModel }));

// Importa el router con los mocks ya activos
const usersRouter = (await import('../src/routes/users.js')).default;

/** Busca el handler final (último) de un método/ruta en un Router de Express */
function getHandler(router, method, path) {
  method = method.toLowerCase();
  for (const layer of router.stack) {
    if (!layer.route) continue;
    if (layer.route.path === path && layer.route.methods[method]) {
      const stack = layer.route.stack;
      return stack[stack.length - 1].handle;
    }
  }
  throw new Error(`Handler not found for ${method.toUpperCase()} ${path}`);
}

/** Response mínimo */
function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('users router unit (sin server, sin BD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Estado por defecto: findOne devuelve null (no existe)
    mockUserModel.findOne.mockImplementation(() => makeChain(null));
  });

  test('GET / → devuelve lista (200)', async () => {
    const handler = getHandler(usersRouter, 'get', '/');

    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockUserModel.find).toHaveBeenCalled();
    // 200 por defecto (no se invoca res.status)
    expect(res.status).not.toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('DELETE /:id → 404 si no existe', async () => {
    const handler = getHandler(usersRouter, 'delete', '/:id');

    const req = { params: { id: '507f1f77bcf86cd799439099' } }; // no existe
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockUserModel.findOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalled();
  });

  test('DELETE /:id → 200 {ok:true} si existe', async () => {
    const handler = getHandler(usersRouter, 'delete', '/:id');

    // Para este test, findOne devuelve un usuario válido
    mockUserModel.findOne.mockImplementation(() => makeChain(usersData[0]));

    const req = { params: { id: '507f1f77bcf86cd799439011' } }; // sí existe
    const res = makeRes();
    const next = jest.fn();

    await handler(req, res, next);

    expect(mockUserModel.findOne).toHaveBeenCalled();
    expect(mockUserModel.deleteOne).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // 200 por defecto
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
