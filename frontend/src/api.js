const BASE = import.meta.env.VITE_API_BASE || '/api';

export const API = {
  token() { return localStorage.getItem('parking_token') || ''; },
  setToken(t) { localStorage.setItem('parking_token', t); },
  clear() { localStorage.removeItem('parking_token'); },
  async get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${API.token()}` }
    });
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${API.token()}` },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async del(path) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${API.token()}` }
    });
    return res.json();
  }
};
