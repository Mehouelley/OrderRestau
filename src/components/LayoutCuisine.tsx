import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { api, resolveMediaUrl } from '../services/api';

export default function LayoutCuisine() {
  const { restaurantSlug } = useParams();
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantImage, setRestaurantImage] = useState<string>('');

  useEffect(() => {
    if (!restaurantSlug) {
      setRestaurantName('');
      return;
    }

    api.restaurant.get(restaurantSlug).then((res) => {
      const name = res.data?.name || '';
      setRestaurantName(name);
      setRestaurantImage(res.data?.image_url ? resolveMediaUrl(res.data.image_url) : '');
      document.title = name ? `${name} - Ecran cuisine` : 'Ecran cuisine';
    }).catch(() => setRestaurantName(''));
  }, [restaurantSlug]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center overflow-hidden">
            {restaurantImage ? (
              <img src={restaurantImage} alt={restaurantName || 'Restaurant'} className="w-full h-full object-cover" />
            ) : (
              <ChefHat className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">Ecran Cuisine</h1>
            <p className="text-xs text-gray-400">{restaurantName || 'Restaurant'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-300" id="kitchen-clock">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-kitchen-400 animate-pulse" />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
