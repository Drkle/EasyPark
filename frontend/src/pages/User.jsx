import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API } from '../api';

// Tarjeta de spot con selección de slot
function SpotCard({ spot, onReserve }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3>{spot.name} <span className="badge">{spot.location}</span></h3>
      <div className="small">Tarifa: {spot.hourlyRate} COP/h | Libres: {spot.availableCount}</div>

      <div className="slots">
        {spot.slots.map(sl => {
          const cls =
            sl.status === 'reserved' ? 'slot rs' :
            selected === sl.code ? 'slot sel' : 'slot av';
          return (
            <div
              key={sl.code}
              className={cls}
              title={sl.status === 'reserved' ? 'Ocupado' : 'Disponible'}
              onClick={() => {
                if (sl.status === 'reserved') return;
                setSelected(sl.code);
              }}
            >
              {sl.code}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          className="btn"
          disabled={!selected}
          onClick={() => onReserve(spot._id, selected)}
        >
          Reservar seleccionado
        </button>
      </div>
    </div>
  );
}

export default function User() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [veh, setVeh] = useState('car');
  const [loading, setLoading] = useState(false);
  const [avail, setAvail] = useState([]);
  const [mine, setMine] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => { loadMine(); }, []);

  async function loadMine() {
    const r = await API.get('/reservations/mine');
    setMine(r?.error ? [] : r);
  }

  async function search() {
    try {
      setErr('');
      if (!start || !end) { setErr('Selecciona inicio y fin'); return; }
      setLoading(true);
      const sISO = new Date(start).toISOString();
      const eISO = new Date(end).toISOString();
      const r = await API.get(`/spots/available?start=${encodeURIComponent(sISO)}&end=${encodeURIComponent(eISO)}&vehicleType=${veh}`);
      if (r?.error) { setErr(r.error); setAvail([]); }
      else setAvail(r);
    } catch (e) {
      console.error(e);
      setErr('Error buscando disponibilidad');
    } finally {
      setLoading(false);
    }
  }

  async function reserve(spotId, slotCode) {
    const sISO = new Date(start).toISOString();
    const eISO = new Date(end).toISOString();
    const r = await API.post('/reservations', { spotId, slotCode, start: sISO, end: eISO, vehicleType: veh });
    if (r?.error) return alert(r.error);
    alert('Reserva creada ✅');
    await loadMine();
    await search();
  }

  return (
    <>
      <Header />
      <div className="container">
        <div className="card hero">
          <h1>Reservar Parqueadero</h1>
          <div className="grid grid-2">
            <div>
              <label>Inicio
                <input className="input" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
              </label>
            </div>
            <div>
              <label>Fin
                <input className="input" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
              </label>
            </div>
            <div>
              <label>Tipo de vehículo
                <select className="select" value={veh} onChange={e => setVeh(e.target.value)}>
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="truck">Camión</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button className="btn" onClick={search} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar disponibles'}
              </button>
            </div>
          </div>
          {err && <div style={{ color: '#dc3545', marginTop: 6 }}>{err}</div>}
        </div>

        <div className="card">
          <h2>Parqueaderos disponibles</h2>
          {avail.length === 0 && <p className="small">Busca disponibilidad para ver resultados</p>}
          {avail.map(sp => (
            <SpotCard key={sp._id} spot={sp} onReserve={reserve} />
          ))}
        </div>

        <div className="card">
          <h2>Mis reservas</h2>
          <button className="btn" onClick={loadMine} style={{ marginBottom: 10 }}>Actualizar</button>
          {mine.length === 0 && <p className="small">No tienes reservas</p>}
          {mine.map(r => (
            <div key={r._id} className="card">
              <b>{r?.spotId?.name || 'Parqueadero'}</b> <span className="badge">{r?.spotId?.location || ''}</span><br />
              <span className="small">Slot: {r.slotCode} | {r.vehicleType}</span><br />
              <span className="small">{new Date(r.start).toLocaleString()} → {new Date(r.end).toLocaleString()}</span><br />
              <span className="small">Estado: {r.status}</span><br />
              {r.status === 'active' && (
                <button
                  className="btn danger"
                  onClick={async () => {
                    const rr = await API.post(`/reservations/${r._id}/cancel`, {});
                    if (rr?.error) alert(rr.error);
                    else { alert('Reserva cancelada'); loadMine(); }
                  }}
                  style={{ marginTop: 8 }}
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
