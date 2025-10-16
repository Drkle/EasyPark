import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../AuthContext';

export default function Register(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('');
  const [msg,setMsg]=useState('');
  const nav=useNavigate();
  const { login } = useAuth();

  async function onSubmit(e){
    e.preventDefault();
    setMsg('Creando cuenta…');
    const r = await API.post('/auth/register',{name,email,password,role});
    if(r?.token){
      login(r.token);
      nav('/', { replace:true });
    }else{
      setMsg(r?.error || 'No se pudo registrar');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Crear Cuenta</h1>
        <form onSubmit={onSubmit}>
          <label>Nombre
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" required/>
          </label>
          <label>Email
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" required/>
          </label>
          <label>Contraseña
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required/>
          </label>
          <label>Rol (opcional)
            <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <button className="btn primary" style={{width:'100%'}}>Registrarme</button>
        </form>
        <div className="error">{msg}</div>
        <div className="alt">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></div>
      </div>
    </div>
  );
}
