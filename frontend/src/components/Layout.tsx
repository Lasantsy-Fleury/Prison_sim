import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, Users, History, BarChart3, Gamepad2, LogOut } from 'lucide-react';

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/jeu', label: 'Jeu de gestion', icon: Gamepad2 },
  { to: '/inmates', label: 'Détenus', icon: Users },
  { to: '/timeline', label: 'Timeline', icon: History },
  { to: '/stats', label: 'Statistiques', icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isGame = pathname === '/jeu';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Shield />
          </span>
          PRISONSIM
        </div>
        <div className="nav-eyebrow">Navigation</div>
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              {l.label}
            </NavLink>
          );
        })}
        <div className="nav-spacer" />
        <div className="user-box">
          <div className="user-name">{user?.name ?? user?.email}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={handleLogout}>
            <LogOut />
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className={`main ${isGame ? 'main-game' : ''}`}>{children}</main>
    </div>
  );
}
