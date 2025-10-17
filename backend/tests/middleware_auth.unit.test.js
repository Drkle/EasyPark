// backend/tests/middleware_auth.unit.test.js
import { jest } from '@jest/globals';

// 👇 Mock de jsonwebtoken para NO validar tokens reales
const jwtMock = { verify: jest.fn() };
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: jwtMock,
  verify: jwtMock.verify,
}));

// Importamos el middleware con el mock ya activo
const { requireAuth, requireAdmin } = await import('../src/middleware/auth.js');

// Helpers de request/response/next sin Express
function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('middleware/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requireAuth → 401 si falta Authorization', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth → 401 si el token es inválido', () => {
    const req = { headers: { authorization: 'Bearer tok' } };
    const res = makeRes();
    const next = jest.fn();

    jwtMock.verify.mockImplementation(() => { throw new Error('bad token'); });

    requireAuth(req, res, next);

    expect(jwtMock.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth → setea req.user y llama next() si es válido', () => {
    const req = { headers: { authorization: 'Bearer tok' } };
    const res = makeRes();
    const next = jest.fn();

    jwtMock.verify.mockReturnValue({ id: 'u1', role: 'admin', email: 'a@b.c' });

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: 'u1', role: 'admin', email: 'a@b.c' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireAdmin → 403 si el rol NO es admin', () => {
    const req = { user: { id: 'u1', role: 'user' } };
    const res = makeRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin → next() si el rol es admin', () => {
    const req = { user: { id: 'u1', role: 'admin' } };
    const res = makeRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
