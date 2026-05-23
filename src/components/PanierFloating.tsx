import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2, X, ShoppingBag, MessageSquare, Clock, MapPin } from 'lucide-react';
import { useCartStore } from '../contexts/CartContext';
import { api } from '../services/api';
import { useEffect } from 'react';

export default function PanierFloating() {
  const [open, setOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { restaurantSlug, tableId } = useParams();
  const { items, orderType, specialInstructions, removeItem, updateQuantity, setOrderType, setSpecialInstructions, total, totalItems, maxPrepTime, clearCart } = useCartStore();

  const count = totalItems();
  const totalPrice = total();
  const isEmporter = tableId === 'emporter';
  const isFromQR = !!tableId && !isEmporter;
  const [tables, setTables] = useState<any[] | null>(null);
  const tableName = isFromQR
    ? (tables ? tables.find((t) => String(t.id) === String(tableId))?.name : `Table ${tableId}`) || `Table ${tableId}`
    : null;

  useEffect(() => {
    if (!restaurantSlug) return;
    api.restaurant.get(restaurantSlug).then((res) => {
      if (res.data?.id) setRestaurantId(String(res.data.id));
    }).catch(() => setRestaurantId(null));

    api.tables.list(restaurantSlug).then((res) => {
      if (res.data) setTables(res.data);
      else setTables(null);
    }).catch(() => setTables(null));
  }, [restaurantSlug]);

  const handleOrder = async () => {
    if (items.length === 0 || !restaurantId) return;
    setOrdering(true);
    try {
      const res = await api.orders.create({
        restaurant_id: restaurantId,
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
        order_type: orderType,
        special_instructions: specialInstructions,
        table_id: isEmporter ? null : (tableId || null),
        total: totalPrice,
        customer_phone: null,
      });
      if (res.data) {
        clearCart();
        setOpen(false);
        navigate(`/paiement/${res.data.id}`);
      }
    } finally {
      setOrdering(false);
    }
  };

  return (
    <>
      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-brand-600" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900">
              {count > 0 ? `${count} article${count > 1 ? 's' : ''}` : 'Panier vide'}
            </span>
          </div>
          {count > 0 && (
            <span className="font-bold text-brand-600">
              {totalPrice.toLocaleString('fr-FR')} F
            </span>
          )}
        </button>
      </div>

      {/* Desktop floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden lg:flex fixed right-6 bottom-6 z-50 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-500/30 items-center justify-center transition-all duration-200 active:scale-95"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {count > 0 && (
            <span className="absolute -top-2 -right-2.5 w-5 h-5 bg-white text-brand-600 text-[10px] font-bold rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
      </button>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:w-96">
          <div className="absolute inset-0 bg-black/40 lg:bg-black/20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-96 bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-brand-500" />
                <h2 className="font-display text-lg font-semibold">Votre panier</h2>
              </div>
              <button onClick={() => setOpen(false)} title="Fermer le panier" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Order type + context */}
            <div className="px-5 py-3 border-b border-gray-50">
              {/* Context info */}
              {(isFromQR || isEmporter) && (
                <div className="mb-2 flex items-center gap-2 text-sm">
                  {isFromQR && tableName && (
                    <>
                      <MapPin className="w-4 h-4 text-brand-500" />
                      <span className="font-medium text-gray-700">{tableName}</span>
                    </>
                  )}
                  {isEmporter && (
                    <>
                      <ShoppingBag className="w-4 h-4 text-ocean-500" />
                      <span className="font-medium text-gray-700">A emporter</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs font-medium text-gray-500 mb-2">Type de commande</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('sur_place')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    orderType === 'sur_place'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sur place
                </button>
                <button
                  onClick={() => setOrderType('emporter')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    orderType === 'emporter'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  A emporter
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-3 stroke-1" />
                  <p className="text-sm">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-brand-600 font-semibold">
                          {(item.price * item.quantity).toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          title="Diminuer la quantité"
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          title="Augmenter la quantité"
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          title="Supprimer l'article"
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special instructions */}
            {items.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <label className="text-xs font-medium text-gray-500">Instructions speciales</label>
                </div>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Ex: Pas trop épicé, sans oignon..."
                  className="input-field text-sm resize-none h-16"
                />
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {totalPrice.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Temps de preparation estime : ~{maxPrepTime()} min
                </p>
                <button
                  onClick={handleOrder}
                  disabled={ordering || !restaurantId}
                  className="btn-primary w-full text-center"
                >
                  {ordering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : !restaurantId ? (
                    'Restaurant non charge'
                  ) : (
                    'Passer la commande'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
