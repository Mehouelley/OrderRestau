import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Clock } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import TableCommandes from '../../components/TableCommandes';
import { api } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const statCards = (stats: any) => [
  { label: 'CA du jour', value: `${(stats.caToday / 1000).toFixed(0)} 000 FCFA`, icon: TrendingUp, color: 'bg-brand-50 text-brand-600', iconBg: 'bg-brand-100' },
  { label: 'Commandes', value: String(stats.ordersToday || 0), icon: ShoppingCart, color: 'bg-ocean-50 text-ocean-600', iconBg: 'bg-ocean-100' },
  { label: 'Clients actifs', value: String(stats.activeClients || 0), icon: Users, color: 'bg-kitchen-50 text-kitchen-600', iconBg: 'bg-kitchen-100' },
  { label: 'Temps moyen', value: `${stats.avgWaitMinutes || 0} min`, icon: Clock, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
];

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const activeOrders = orders.filter((o) => o.status !== 'terminee');
  const activeTables = tables.filter((t) => t.status === 'occupee');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, tablesRes] = await Promise.all([
        api.stats.get(),
        api.orders.list(),
        api.tables.list(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (tablesRes.data) setTables(tablesRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh toutes les 20 secondes
    const interval = setInterval(loadDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as typeof o.status } : o)));
  };

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
    datasets: [
      {
        label: 'Commandes',
        data: (stats?.hourlyOrders) || Array.from({ length: 24 }, () => 0),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={loadDashboardData} 
          disabled={loading}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          title="Actualiser maintenant"
        >
          ↻ Actualiser
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats || { caToday:0, ordersToday:0, activeClients:0, avgWaitMinutes:0 }).map(({ label, value, icon: Icon, color, iconBg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Commandes par heure</h2>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Active orders */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Commandes en cours</h2>
          <span className="badge bg-brand-50 text-brand-700">{activeOrders.length}</span>
        </div>
        <TableCommandes orders={activeOrders} onStatusChange={handleStatusChange} />
      </div>

      {/* Active tables */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Clients actifs en salle</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {activeTables.map((table) => (
            <div key={table.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-600">{table.name.replace(/\D/g, '') || '?'}</span>
                </div>
                <span className="font-medium text-gray-900 text-sm">{table.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-kitchen-500" />
                <span className="text-xs text-gray-500">Occupee</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
