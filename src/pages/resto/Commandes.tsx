import { useState, useEffect } from 'react';
import TableCommandes from '../../components/TableCommandes';
import { api } from '../../services/api';

export default function Commandes() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('prete');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.list();
      if (res.data) {
        setOrders(res.data);
        setLastRefresh(new Date());
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh toutes les 15 secondes
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as typeof o.status } : o)));
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  const readyOrders = orders.filter((o) => o.status === 'prete');
  const lateReadyOrders = readyOrders.filter((order) => {
    if (!order.promised_ready_at) return false;
    return new Date(order.promised_ready_at).getTime() < Date.now();
  });

  const statusFilters = [
    { key: 'all', label: 'Toutes', count: orders.length },
    { key: 'prete', label: 'A servir', count: orders.filter((o) => o.status === 'prete').length },
    { key: 'nouvelle', label: 'Nouvelles', count: orders.filter((o) => o.status === 'nouvelle').length },
    { key: 'en_cours', label: 'En cours', count: orders.filter((o) => o.status === 'en_cours').length },
    { key: 'servie', label: 'Servies', count: orders.filter((o) => o.status === 'servie').length },
    { key: 'terminee', label: 'Terminees', count: orders.filter((o) => o.status === 'terminee').length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">A servir</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-400 mt-1">
              Actualisé à {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <button 
          onClick={loadOrders} 
          disabled={loading}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          title="Actualiser les commandes maintenant"
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold">Commandes prêtes à servir</p>
            <p className="text-xs mt-0.5 text-emerald-700">
              L’équipe salle peut prendre ces commandes tout de suite. Les tables en retard sont à traiter en priorité.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-emerald-800">Prêtes : {readyOrders.length}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-red-700">En retard : {lateReadyOrders.length}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === f.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === f.key ? 'bg-white/20' : 'bg-gray-200'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <TableCommandes orders={filtered} onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
}
