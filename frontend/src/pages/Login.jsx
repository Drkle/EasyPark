import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../AuthContext';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const nav=useNavigate();
  const { login } = useAuth();

  async function onSubmit(e){
    e.preventDefault();
    setMsg('Iniciando…');
    const r = await API.post('/auth/login',{email,password});
    if(r?.token){
      login(r.token);
      nav('/', { replace:true });
    }else{
      setMsg(r?.error || 'Credenciales inválidas');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>
        <form onSubmit={onSubmit}>
          <label>Email
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" required/>
          </label>
          <label>Contraseña
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
          </label>
          <button className="btn primary" style={{width:'100%'}}>Entrar</button>
        </form>
        <div className="error">{msg}</div>
        <div className="alt">¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link></div>
      </div>
    </div>
  );
}
