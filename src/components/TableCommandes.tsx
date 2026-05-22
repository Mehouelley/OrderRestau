import StatutBadge from './StatutBadge';
import { Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';

interface Order {
  id: string;
  table_name: string;
  status: 'nouvelle' | 'en_cours' | 'prete' | 'servie' | 'terminee';
  order_type: string;
  total: number;
  items: { product_name: string; quantity: number; unit_price: number }[];
  created_at: string;
  promised_ready_at?: string | null;
  special_instructions: string;
}

interface TableCommandesProps {
  orders: Order[];
  onStatusChange: (id: string, status: string) => void;
}

const nextStatus: Record<string, string> = {
  nouvelle: 'en_cours',
  en_cours: 'prete',
  prete: 'servie',
  servie: 'terminee',
};

const statusActions: Record<string, { label: string; color: string }> = {
  nouvelle: { label: 'Accepter', color: 'bg-orange-500 hover:bg-orange-600' },
  en_cours: { label: 'Pret', color: 'bg-emerald-500 hover:bg-emerald-600' },
  prete: { label: 'Servi', color: 'bg-gray-500 hover:bg-gray-600' },
  servie: { label: 'Cloturer', color: 'bg-slate-600 hover:bg-slate-700' },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "A l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  return `Il y a ${Math.floor(diff / 60)}h${diff % 60}`;
}

function isLate(promisedReadyAt?: string | null): boolean {
  if (!promisedReadyAt) return false;
  return new Date(promisedReadyAt).getTime() < Date.now();
}

export default function TableCommandes({ orders, onStatusChange }: TableCommandesProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.data) {
        onStatusChange(orderId, newStatus);
        setMenuOpen(null);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plats</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Heure</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${order.status === 'prete' ? 'bg-emerald-50/40' : ''}`}>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-gray-900 text-base">{order.table_name}</span>
                  {order.promised_ready_at && (
                    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLate(order.promised_ready_at) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      Prêt à {new Date(order.promised_ready_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                {order.order_type === 'emporter' && (
                  <span className="ml-0 text-[10px] font-medium bg-ocean-50 text-ocean-700 px-1.5 py-0.5 rounded-full w-fit">
                    Emporter
                  </span>
                )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-gray-700">
                  {(() => {
                    const items = order.items || [];
                    return items.map((item, i) => (
                      <span key={i}>
                        {item.quantity}x {item.product_name}
                        {i < items.length - 1 ? ', ' : ''}
                      </span>
                    ));
                  })()}
                </div>
                {order.special_instructions && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                    {order.special_instructions}
                  </p>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(order.created_at)}
                </div>
                {order.promised_ready_at && (
                  <div className={`mt-1 text-xs font-medium ${isLate(order.promised_ready_at) ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isLate(order.promised_ready_at) ? 'En retard' : 'Dans les temps'}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <StatutBadge status={order.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <div className="relative inline-block">
                  {order.status !== 'terminee' ? (
                    <button
                      onClick={() => handleStatusUpdate(order.id, nextStatus[order.status])}
                      disabled={updatingId === order.id}
                      className={`${statusActions[order.status].color} text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50`}
                    >
                      {updatingId === order.id ? '...' : statusActions[order.status].label}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Terminee</span>
                  )}
                  <button
                    onClick={() => setMenuOpen(menuOpen === order.id ? null : order.id)}
                    className="ml-1 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Plus d'actions"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  {menuOpen === order.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                      {(['nouvelle', 'en_cours', 'prete', 'servie', 'terminee'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            handleStatusUpdate(order.id, s);
                          }}
                          disabled={updatingId === order.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Passer a : {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
