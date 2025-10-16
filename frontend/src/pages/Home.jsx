import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API } from '../api';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_BASE || '/api';

export default function Home(){
  const [stats,setStats]=useState(null);
  const [last,setLast]=useState('—');

  async function loadOnce(){
    const r = await API.get('/stats');
    if(!r || r.error) return;
    setStats(r);
    setLast(new Date().toLocaleTimeString());
  }

  useEffect(()=>{
    loadOnce(); // primer fetch

    // Conectar SSE con token en query
    const token = API.token();
    const url = `${BASE}/stats/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: false });

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setStats(data);
        setLast(new Date().toLocaleTimeString());
      } catch {}
    };
    es.onerror = () => {
      // Si falla SSE, seguimos con polling cada 30s como respaldo
      console.warn('SSE desconectado; usando polling');
      es.close();
      const id = setInterval(loadOnce, 30000);
      return () => clearInterval(id);
    };

    return () => { es.close(); };
  },[]);

  return (
    <>
      <Header/>
      <div className="container">
        {/* HERO */}
        <div className="card hero">
          <h1>Bienvenido a EasyPark</h1>
          <p>Tu sistema inteligente de gestión y reserva de parqueaderos en la nube.</p>
          <div className="actions">
            <Link to="/user" className="btn primary">Reservar ahora</Link>
            <a href="#about" className="btn white">Saber más</a>
          </div>
        </div>

        {/* STATS */}
        <div className="card stats">
          <div className="title">Estadísticas del Sistema</div>
          <div className="bar">
            <button className="btn-mini" onClick={loadOnce}>Actualizar ahora</button>
          </div>
          <div className="last">Última actualización: {last}</div>

          {!stats && <div className="card">Cargando…</div>}
          {stats && (
            <div className="grid grid-2">
              <div className="kpi"><h3>{stats.activeSpots}</h3><p>Parqueaderos activos</p></div>
              <div className="kpi"><h3>{stats.totalReservations}</h3><p>Reservas totales</p></div>
              <div className="kpi"><h3>{stats.totalUsers}</h3><p>Usuarios registrados</p></div>
            </div>
          )}
        </div>

        {/* DETALLE PARQUEADEROS */}
        <div className="card">
          <h2>Parqueaderos y ocupación (ahora)</h2>
          {!stats && <p>Cargando…</p>}
          {stats && (stats.details||[]).map(d=>(
            <div key={d.id} className="card" style={{marginBottom:12}}>
              <b>{d.name}</b> <span className="badge">{d.location}</span><br/>
              <small>Total: {d.totalSlots} | Ocupados: {d.busySlots} | Libres: {d.freeSlots}</small><br/>
              <small>{d.busySlotCodes?.length ? `Slots ocupados: ${d.busySlotCodes.join(', ')}` : `Sin ocupación ahora`}</small>
            </div>
          ))}
        </div>

        {/* ABOUT / CONTACT */}
        <div id="about" className="card">
          <h2>About Us</h2>
          <p>EasyPark es una plataforma diseñada para optimizar la experiencia de estacionamiento urbano…</p>
        </div>
        <div className="card">
          <h2>Contact</h2>
          <p>Puedes escribirnos a <b>soporte@easypark.com</b> o llamarnos al <b>+57 310 123 4567</b>.</p>
        </div>
      </div>
    </>
  );
}
