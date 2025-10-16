import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API } from '../api';

export default function Admin(){
  const [name,setName]=useState(''); const [location,setLocation]=useState('');
  const [rate,setRate]=useState(0); const [vehicles,setVehicles]=useState(['car','motorcycle']);
  const [slotsCount,setSlotsCount]=useState(10);
  const [spots,setSpots]=useState([]); const [users,setUsers]=useState([]);
  const [msg,setMsg]=useState('');

  useEffect(()=>{ loadSpots(); loadUsers(); },[]);

  function toggleVeh(v){
    setVehicles(prev=> prev.includes(v) ? prev.filter(x=>x!==v) : [...prev,v] );
  }

  async function createSpot(e){
    e.preventDefault();
    const r=await API.post('/spots',{name,location,hourlyRate:Number(rate),vehicleTypes:vehicles,slotsCount:Number(slotsCount)});
    if(r.error) setMsg(r.error); else { setMsg('Parqueadero creado ✅'); setName(''); setLocation(''); setRate(0); setSlotsCount(10); loadSpots(); }
  }

  async function loadSpots(){ const r=await API.get('/spots'); setSpots(r.error?[]:r); }
  async function delSpot(id){
    if(!confirm('¿Eliminar este parqueadero?')) return;
    const r = await API.del(`/spots/${id}`);
    if(r.error) alert(r.error); else { alert('Parqueadero eliminado'); loadSpots(); }
  }

  async function loadUsers(){ const r=await API.get('/users'); setUsers(r.error?[]:r); }
  async function delUser(id){
    if(!confirm('¿Eliminar usuario?')) return;
    const r = await API.del(`/users/${id}`);
    if(r.error) alert(r.error); else { alert('Usuario eliminado'); loadUsers(); }
  }

  return (
    <>
      <Header/>
      <div className="container">
        <div className="card">
          <h1>Panel de Administrador</h1>
          <form onSubmit={createSpot} className="grid grid-2">
            <div><label>Nombre</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div>
            <div><label>Ubicación</label><input className="input" value={location} onChange={e=>setLocation(e.target.value)} required/></div>
            <div><label>Tarifa (COP/h)</label><input type="number" className="input" value={rate} onChange={e=>setRate(e.target.value)} min="0" step="100"/></div>
            <div>
              <label>Tipos de vehículo</label>
              <div className="card" style={{padding:'10px'}}>
                <label><input type="checkbox" checked={vehicles.includes('car')} onChange={()=>toggleVeh('car')}/> Carro</label><br/>
                <label><input type="checkbox" checked={vehicles.includes('motorcycle')} onChange={()=>toggleVeh('motorcycle')}/> Moto</label><br/>
                <label><input type="checkbox" checked={vehicles.includes('truck')} onChange={()=>toggleVeh('truck')}/> Camión</label>
              </div>
            </div>
            <div><label>Cantidad de slots</label><input type="number" className="input" value={slotsCount} onChange={e=>setSlotsCount(e.target.value)} min="1" max="200"/></div>
            <div style={{display:'flex',alignItems:'end'}}><button className="btn">Crear</button></div>
          </form>
          <p className="small">{msg}</p>
        </div>

        <div className="card">
          <h2>Parqueaderos</h2>
          <div className="grid grid-2">
            {spots.map(s=>(
              <div key={s._id} className="card">
                <b>{s.name}</b> <span className="badge">{s.location}</span><br/>
                <span className="small">Tarifa: {s.hourlyRate} | Slots: {s.slots?.length||0} | Activo: {s.active?'Sí':'No'}</span><br/>
                <span className="small">Tipos: {s.vehicleTypes.join(', ')}</span><br/>
                <button className="btn danger" onClick={()=>delSpot(s._id)} style={{marginTop:8}}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Usuarios</h2>
          <div className="grid grid-2">
            {users.map(u=>(
              <div key={u._id} className="card">
                <b>{u.name || '(sin nombre)'} ({u.role})</b><br/>
                <span className="small">{u.email}</span><br/>
                <button className="btn danger" onClick={()=>delUser(u._id)} style={{marginTop:8}}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
