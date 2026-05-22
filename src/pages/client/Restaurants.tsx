import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.restaurant.list().then((res) => {
      if (res.data) setRestaurants(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.cuisine && r.cuisine.toLowerCase().includes(search.toLowerCase())) ||
      (r.address && r.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-gray-900">Plateforme de commande</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Commander dans un restaurant
          </h1>
          <p className="text-gray-500 text-sm">
            Choisissez un restaurant, reservez votre table et commandez a l'avance pour ne pas attendre.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un restaurant, un type de cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Restaurant list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Chargement des restaurants...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <button
                key={r.id || r.slug}
                onClick={() => navigate(`/restaurant/${r.slug}`)}
                className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto bg-gray-200 relative overflow-hidden flex-shrink-0">
                    <img
                      src={resolveMediaUrl(r.image_url || r.image) || 'https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-gray-900">{r.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {r.address || 'Adresse non disponible'}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{r.cuisine || 'Cuisine variée'}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        ~{r.avgPrep ?? r.avg_prep_time ?? 20} min
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-kitchen-600">
                        <div className="w-2 h-2 rounded-full bg-kitchen-400" />
                        Ouvert
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 stroke-1" />
                <p>Aucun restaurant trouve</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
