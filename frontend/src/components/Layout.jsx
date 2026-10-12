import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Brain, Briefcase, LogOut, Moon, Sun, PanelLeft, MessagesSquare, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resumes', label: 'Resume & ATS', icon: FileText },
  { to: '/aptitude', label: 'Aptitude', icon: Brain },
  { to: '/interview', label: 'Mock Interview', icon: MessagesSquare },
  { to: '/jobs', label: 'Job Tracker', icon: Briefcase },
];

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading...</p>;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const toggleDark = () => { document.documentElement.classList.toggle('dark'); setDark(!dark); };

  return (
    <div className="flex min-h-screen">
      <aside className={`${open ? 'w-60' : 'w-16'} shrink-0 border-r border-slate-200 bg-white p-3 transition-all dark:border-slate-800 dark:bg-slate-900`}>
        <div className="mb-6 flex items-center justify-between px-2">
          {open && <span className="text-lg font-bold text-indigo-600">Placemap AI</span>}
          <button onClick={() => setOpen(!open)} aria-label="Toggle sidebar"><PanelLeft size={18} /></button>
        </div>
        <nav className="space-y-1">
          {[...links, ...(['admin', 'placement_officer'].includes(user.role) ? [{ to: '/admin', label: 'Admin', icon: Shield }] : [])].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Icon size={18} />{open && label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={toggleDark} className="btn-ghost" aria-label="Toggle dark mode">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <span className="text-sm">{user.name}</span>
          <button onClick={logout} className="btn-ghost flex items-center gap-1"><LogOut size={14} /> Logout</button>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}
