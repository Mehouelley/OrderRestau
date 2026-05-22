import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Square,
  BarChart3,
  Settings,
  LogOut,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../services/api';

const navItems = [
  { to: '/resto/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resto/commandes', label: 'Commandes', icon: ClipboardList },
  { to: '/resto/menu', label: 'Menu', icon: BookOpen },
  { to: '/resto/tables', label: 'Tables', icon: Square },
  { to: '/resto/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/resto/parametres', label: 'Paramètres', icon: Settings },
];

export default function LayoutResto() {
  const [collapsed, setCollapsed] = useState(false);
  const { restaurant, logout, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${restaurant?.name || 'Restaurant'} - Espace restaurateur`;
  }, [restaurant?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
                {restaurant?.image_url ? (
                  <img
                    src={resolveMediaUrl(restaurant.image_url)}
                    alt={restaurant.name || 'Restaurant'}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                )}
              </div>
              {!collapsed && (
                <span className="font-display text-base font-semibold text-gray-900 truncate">
                  {restaurant?.name || 'Restaurant'}
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Deconnexion</span>}
            </button>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {restaurant?.name || 'Restaurant'}
              </h1>
              <p className="text-sm text-gray-500">Gestion du restaurant</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700">
                  {user?.email?.[0]?.toUpperCase() || 'R'}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
