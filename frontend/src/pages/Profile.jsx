import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../AuthContext';
import { API } from '../api';

export default function Profile(){
  const { user } = useAuth();
  const [history,setHistory]=useState([]);

  useEffect(()=>{ (async()=>{ const r=await API.get('/reservations/mine'); setHistory(r.error?[]:r); })(); },[]);

  return (
    <>
      <Header/>
      <div className="container">
        <div className="card">
          <h1>Perfil</h1>
          <p><b>Nombre:</b> {user?.name || '—'}</p>
          <p><b>Correo:</b> {user?.email}</p>
          <p><b>Rol:</b> {user?.role}</p>
        </div>

        <div className="card">
          <h2>Historial de Reservas</h2>
          {history.length===0 && <p className="small">No tienes reservas.</p>}
          {history.map(x=>(
            <div key={x._id} className="card">
              <b>{x?.spotId?.name || 'Parqueadero'}</b> <span className="badge">{x?.spotId?.location || ''}</span><br/>
              <span className="small">Slot: {x.slotCode} | {x.vehicleType}</span><br/>
              <span className="small">{new Date(x.start).toLocaleString()} → {new Date(x.end).toLocaleString()}</span><br/>
              <span className="small">Estado: {x.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
