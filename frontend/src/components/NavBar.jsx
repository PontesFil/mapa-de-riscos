import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="nav">
      <div className="brand">
        <span className="brand-mark">CH</span>
        <div>
          <div className="brand-title">Saude Comunitaria</div>
          <div className="brand-sub">Mapeamento de Risco</div>
        </div>
      </div>
      <nav className="nav-links">
        <NavLink to="/dashboard">Painel</NavLink>
        <NavLink to="/households">Domicilios</NavLink>
        <NavLink to="/map">Mapa</NavLink>
      </nav>
      <button className="button ghost" onClick={handleLogout}>Sair</button>
    </header>
  );
};
