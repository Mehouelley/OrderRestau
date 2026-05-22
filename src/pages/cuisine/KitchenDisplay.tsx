import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';

interface KitchenOrder {
  id: string;
  table_name: string;
  status: 'nouvelle' | 'en_cours' | 'prete';
  items: { product_name: string; quantity: number }[];
  created_at: string;
  promised_ready_at?: string | null;
  special_instructions: string;
}

const columns: { key: KitchenOrder['status']; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'nouvelle', label: 'NOUVELLES', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { key: 'en_cours', label: 'EN COURS', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { key: 'prete', label: 'PRETES', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
];

const nextStatus: Record<string, string> = {
  nouvelle: 'en_cours',
  en_cours: 'prete',
};

const actionLabels: Record<string, { label: string; color: string }> = {
  nouvelle: { label: 'Preparer', color: 'bg-orange-500 hover:bg-orange-600' },
  en_cours: { label: 'Pret !', color: 'bg-emerald-500 hover:bg-emerald-600' },
};

const statusPriority: Record<KitchenOrder['status'], number> = {
  nouvelle: 0,
  en_cours: 1,
  prete: 2,
};

function getMinutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function getMinutesUntil(dateStr: string, nowMs: number): number {
  return Math.ceil((new Date(dateStr).getTime() - nowMs) / 60000);
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [now, setNow] = useState(Date.now());
  const lastAlertKeyRef = useRef('');
  const { restaurantSlug } = useParams();

  const slug = restaurantSlug || import.meta.env.VITE_KITCHEN_SLUG || 'demo-restaurant';
  const overdueOrders = orders.filter((order) => {
    if (!order.promised_ready_at) return false;
    return getMinutesUntil(order.promised_ready_at, now) < 0;
  });

  const orderedOrders = [...orders].sort((left, right) => {
    const leftLate = left.promised_ready_at ? getMinutesUntil(left.promised_ready_at, now) < 0 : false;
    const rightLate = right.promised_ready_at ? getMinutesUntil(right.promised_ready_at, now) < 0 : false;

    if (leftLate !== rightLate) return leftLate ? -1 : 1;

    const statusDiff = statusPriority[left.status] - statusPriority[right.status];
    if (statusDiff !== 0) return statusDiff;

    const leftTime = left.promised_ready_at ? new Date(left.promised_ready_at).getTime() : new Date(left.created_at).getTime();
    const rightTime = right.promised_ready_at ? new Date(right.promised_ready_at).getTime() : new Date(right.created_at).getTime();
    return leftTime - rightTime;
  });

  const loadKitchenOrders = async () => {
    try {
      const res = await api.kitchen.ordersBySlug(slug);
      if (res.data && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders.filter((o: any) => o.status !== 'servie'));
      }
    } catch (err) {
      console.error('Error loading kitchen orders:', err);
    }
  };

  useEffect(() => {
    // Charger les commandes initialement
    loadKitchenOrders();
    
    // Timer pour l'heure (mise à jour toutes les 30 secondes)
    const timeInterval = setInterval(() => setNow(Date.now()), 30000);
    
    // Auto-refresh des commandes toutes les 10 secondes
    const orderInterval = setInterval(loadKitchenOrders, 10000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(orderInterval);
    };
  }, []);

  useEffect(() => {
    if (overdueOrders.length === 0) {
      lastAlertKeyRef.current = '';
      return;
    }

    const alertKey = overdueOrders
      .map((order) => order.id)
      .sort()
      .join(',');

    if (lastAlertKeyRef.current === alertKey) {
      return;
    }

    lastAlertKeyRef.current = alertKey;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const beep = (frequency: number, startAt: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const attack = 0.02;
      const decay = 0.18;
      gainNode.gain.exponentialRampToValueAtTime(0.12, startAt + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + attack + decay);

      oscillator.start(startAt);
      oscillator.stop(startAt + attack + decay + 0.05);
    };

    const startAt = audioContext.currentTime + 0.05;
    beep(880, startAt);
    beep(660, startAt + 0.24);

    return () => {
      audioContext.close().catch(() => {});
    };
  }, [overdueOrders]);

  const moveOrder = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = nextStatus[order.status];
    if (!next) return;

    // Optimistic UI
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next as KitchenOrder['status'] } : o)));

    // Persist to backend (utilise le slug courant de la route/fallback défini en haut)
    api.kitchen.updateOrderStatus(id, next, slug).then((res) => {
      if (res.data && res.data.id) {
        // success
      }
    }).catch(() => {
      // rollback on error
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: order.status } : o)));
    });
  };

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-hidden">
      {overdueOrders.length > 0 && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <p className="text-sm font-semibold">
              {overdueOrders.length} commande{overdueOrders.length > 1 ? 's' : ''} en retard sur l'heure promise.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 h-full">
        {columns.map((col) => {
          const colOrders = orderedOrders.filter((o) => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${col.bgColor} border ${col.borderColor} mb-4`}>
                <div className="flex items-center gap-2">
                  <h2 className={`font-bold text-sm tracking-wider ${col.color}`}>{col.label}</h2>
                  <span className={`text-xs font-bold ${col.color} bg-gray-800 px-2 py-0.5 rounded-full`}>
                    {colOrders.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                {colOrders.map((order) => {
                  const minutesAgo = getMinutesAgo(order.created_at);
                  const minutesUntilReady = order.promised_ready_at
                    ? getMinutesUntil(order.promised_ready_at, now)
                    : 15 - minutesAgo;
                  const isLate = minutesUntilReady < 0;
                  const timeLabel = order.promised_ready_at
                    ? isLate
                      ? `Retard de ${Math.abs(minutesUntilReady)} min`
                      : `${minutesUntilReady} min restantes`
                    : `${minutesAgo} min`;

                  return (
                    <div
                      key={order.id}
                      className={`bg-gray-900 border rounded-xl p-4 transition-all duration-200 hover:bg-gray-800/80 ${
                        isLate ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-gray-800'
                      }`}
                    >
                      {/* Table number */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Table
                          </div>
                          <div className="text-3xl font-black leading-none text-white">{order.table_name}</div>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            isLate ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700'
                          }`}
                        >
                          {isLate ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {timeLabel}
                        </div>
                      </div>

                      {order.promised_ready_at && (
                        <div className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${isLate ? 'bg-red-500/10 text-red-200 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'}`}>
                          Heure promise : {new Date(order.promised_ready_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-1.5 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              <span className="font-bold text-white mr-1.5">{item.quantity}x</span>
                              {item.product_name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Special instructions */}
                      {order.special_instructions && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                          <p className="text-xs text-amber-400 font-medium mb-0.5">Note :</p>
                          <p className="text-xs text-amber-300">{order.special_instructions}</p>
                        </div>
                      )}

                      {/* Action button */}
                      {col.key !== 'prete' && (
                        <button
                          onClick={() => moveOrder(order.id)}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 ${
                            actionLabels[col.key]?.color || ''
                          }`}
                        >
                          {actionLabels[col.key]?.label}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      <a
                        href={`/api/kitchen/orders/${order.id}/ticket`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-700 text-gray-200 bg-gray-900 hover:bg-gray-800 transition-all duration-200 active:scale-95"
                      >
                        Ticket cuisine
                      </a>
                    </div>
                  );
                })}

                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                    <Clock className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-sm">Aucune commande</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
