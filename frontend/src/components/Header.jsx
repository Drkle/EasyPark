import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Header(){
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const goLogout = () => { logout(); nav('/login'); };

  return (
    <header className="header">
      <div className="nav">
        <div className="brand">🚗 <span>EasyPark</span></div>
        <div className="right">
          <Link className={loc.pathname==='/'?'active':''} to="/">Inicio</Link>
          <Link className={loc.pathname.startsWith('/user')?'active':''} to="/user">Reservar</Link>
          {user?.role==='admin' && (
            <Link className={loc.pathname.startsWith('/admin')?'active':''} to="/admin">Admin</Link>
          )}
          <Link className={loc.pathname.startsWith('/profile')?'active':''} to="/profile">Perfil</Link>
          <button className="btn white" onClick={goLogout}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
}
