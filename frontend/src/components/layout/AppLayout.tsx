import { Bot, Car, Compass, LayoutDashboard, LogOut, MapPin, Plane } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/flights', label: 'Vuelos', icon: Plane },
  { to: '/cars', label: 'Coches', icon: Car },
  { to: '/attractions', label: 'Atracciones', icon: MapPin },
  { to: '/trips', label: 'Mis viajes', icon: Compass },
  { to: '/ai', label: 'Asistente IA', icon: Bot },
];

export function AppLayout() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 p-4">
        <div className="px-2 py-3 mb-2">
          <span className="text-xl font-bold text-brand-600">TripNow</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            clear();
            navigate('/login');
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
