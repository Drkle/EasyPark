import { createContext, useContext, useEffect, useState } from 'react';
import { API } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {email, role, name, exp}

  useEffect(() => {
    const t = API.token();
    if (!t) return;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const now = Math.floor(Date.now()/1000);
      if (payload.exp && payload.exp > now) setUser(payload);
      else API.clear();
    } catch { API.clear(); }
  }, []);

  const login = (token) => { API.setToken(token); 
    const payload = JSON.parse(atob(token.split('.')[1])); setUser(payload); };
  const logout = () => { API.clear(); setUser(null); };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}
