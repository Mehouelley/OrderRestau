import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { api, resolveMediaUrl } from '../services/api';

export default function LayoutClient() {
  const { restaurantSlug, tableId } = useParams();
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantImage, setRestaurantImage] = useState('');
  const [tableLabel, setTableLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantSlug) return;

    api.restaurant.get(restaurantSlug).then((res) => {
      if (res.data?.name) {
        setRestaurantName(res.data.name);
        document.title = `${res.data.name} - Commande en ligne`;
      }
      setRestaurantImage(res.data?.image_url ? resolveMediaUrl(res.data.image_url) : '');
    }).catch(() => setRestaurantName('Restaurant'));

    if (!tableId) {
      setTableLabel(null);
      return;
    }

    if (tableId === 'emporter') {
      setTableLabel('A emporter');
      return;
    }

    api.tables.list(restaurantSlug).then((res) => {
      const table = res.data?.find((t: any) => String(t.id) === String(tableId));
      setTableLabel(table?.name || `Table ${tableId}`);
    }).catch(() => setTableLabel(`Table ${tableId}`));
  }, [restaurantSlug, tableId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center overflow-hidden">
              {restaurantImage ? (
                <img src={restaurantImage} alt={restaurantName} className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="font-display text-lg font-semibold text-gray-900">
              {restaurantName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {tableLabel && <span className="hidden sm:inline text-sm text-gray-500">{tableLabel}</span>}
            <div className="w-2 h-2 rounded-full bg-kitchen-500 animate-pulse" />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
