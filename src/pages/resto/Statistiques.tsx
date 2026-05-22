import { useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
import { api } from '../../services/api';
import { useEffect } from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

type Filter = 'today' | 'week' | 'month';

export default function Statistiques() {
  const [filter, setFilter] = useState<Filter>('today');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const filters = [
    { key: 'today' as const, label: 'Aujourd\'hui' },
    { key: 'week' as const, label: '7 jours' },
    { key: 'month' as const, label: '30 jours' },
  ];

  useEffect(() => {
    api.stats.get().then((res) => {
      if (res.data) setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const caData = {
    labels: (stats?.weeklyCA || []).map((d: any) => d.day),
    datasets: [
      {
        label: 'CA (FCFA)',
        data: (stats?.weeklyCA || []).map((d: any) => d.amount),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const topProductsData = {
    labels: (stats?.topProducts || []).map((p: any) => p.name),
    datasets: [
      {
        label: 'Ventes',
        data: (stats?.topProducts || []).map((p: any) => p.count),
        backgroundColor: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
    datasets: [
      {
        label: 'Commandes',
        data: (stats?.hourlyOrders || Array(24).fill(0)),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const pieData = {
    labels: ['Sur place', 'A emporter'],
    datasets: [
      {
        data: [(stats?.orderTypeSplit?.sur_place) || 0, (stats?.orderTypeSplit?.emporter) || 0],
        backgroundColor: ['#f97316', '#3b82f6'],
        borderWidth: 0,
        hoverOffset: 8,
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
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af' }, beginAtZero: true },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
      },
      tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 },
    },
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Chargement des statistiques...</p>
          </div>
        </div>
      ) : (
      <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* CA evolution */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Evolution du CA</h2>
        <div className="h-64">
          <Line data={caData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top 5 des plats vendus</h2>
          <div className="h-64">
            <Bar data={topProductsData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>

        {/* Order type split */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Sur place vs Emporter</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Hourly heatmap */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Commandes par heure</h2>
        <div className="h-64">
          <Bar data={hourlyData} options={chartOptions} />
        </div>
      </div>
      </>
      )}
    </div>
  );
}
