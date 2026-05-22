import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Users, CheckCircle2, XCircle, UtensilsCrossed, ShoppingBag, Wifi } from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';

type OrderMode = 'sur_place' | 'emporter';

export default function RestaurantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<OrderMode | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const freeTables = tables.filter((t) => t.status === 'libre');
  const occupiedTables = tables.filter((t) => t.status === 'occupee');

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.restaurant.get(slug),
      api.tables.list(slug),
    ]).then(([resRes, tablesRes]) => {
      if (resRes.data) {
        setRestaurant(resRes.data);
      }
      // Ensure tables is always an array
      if (tablesRes.data && Array.isArray(tablesRes.data)) {
        setTables(tablesRes.data);
      } else {
        setTables([]);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error loading restaurant or tables:', err);
      setLoading(false);
    });
  }, [slug]);

  const handleContinue = () => {
    if (mode === 'emporter') {
      navigate(`/menu/${slug}/emporter`);
    } else if (mode === 'sur_place' && selectedTable) {
      navigate(`/menu/${slug}/${selectedTable}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Chargement du restaurant...</p>
          </div>
        </div>
      ) : !restaurant ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">Restaurant non trouvé</p>
            <p className="text-xs text-gray-400 mt-1">Slug: {slug}</p>
            <button onClick={() => navigate(-1)} className="mt-3 btn-primary">
              Retour
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Restaurant header */}
          <div className="relative">
            <div className="h-48 sm:h-56 bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden">
              <img
                src={resolveMediaUrl(restaurant.image_url || restaurant.image) || 'https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=1200'}
                alt={restaurant.name}
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-700/80 to-transparent" />
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white px-3 py-2 rounded-xl hover:bg-white/25 transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {restaurant.address || 'Adresse non disponible'}
                      </div>
                      <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{restaurant?.avgPrep ?? 20} min en moyenne
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-kitchen-50 text-kitchen-700 px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-kitchen-400 animate-pulse" />
                    Ouvert
                  </div>
                </div>
              </div>
            </div>
          </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Mode selection */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Comment souhaitez-vous commander ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => { setMode('sur_place'); setSelectedTable(null); }}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                mode === 'sur_place'
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {mode === 'sur_place' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sur place</h3>
              <p className="text-sm text-gray-500">Reservez une table et commandez a l'avance. Votre commande sera prete quand vous arrivez.</p>
            </button>

            <button
              onClick={() => { setMode('emporter'); setSelectedTable(null); }}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                mode === 'emporter'
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {mode === 'emporter' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-ocean-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">A emporter</h3>
              <p className="text-sm text-gray-500">Commandez et venez recuperer votre commande. Pas besoin de table, vous arrivez et c'est pret.</p>
            </button>
          </div>
        </div>

        {/* Table selection (sur place) */}
        {mode === 'sur_place' && (
          <div className="mb-6 animate-fade-in">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-1">Choisissez votre table</h2>
            <p className="text-sm text-gray-500 mb-4">
              Les tables vertes sont disponibles. Selectionnez celle qui vous convient.
            </p>

            {tables.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-800">
                  Aucune table disponible pour ce restaurant. Veuillez contacter le restaurateur.
                </p>
              </div>
            ) : (
              <>
                {/* Availability summary */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-kitchen-400" />
                    <span className="text-gray-600">{freeTables.length} libres</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-gray-600">{occupiedTables.length} occupees</span>
                  </div>
                </div>

                {/* Tables grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {tables.map((table) => {
                    const isFree = table.status === 'libre';
                    const isSelected = selectedTable === table.id;
                    return (
                      <button
                        key={table.id}
                        onClick={() => isFree && setSelectedTable(table.id)}
                        disabled={!isFree}
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 shadow-sm'
                            : isFree
                              ? 'border-kitchen-200 bg-kitchen-50/50 hover:border-kitchen-300 hover:bg-kitchen-50'
                              : 'border-red-100 bg-red-50/50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                          isSelected ? 'bg-brand-100' : isFree ? 'bg-kitchen-100' : 'bg-red-100'
                        }`}>
                          {isFree ? (
                            <CheckCircle2 className={`w-5 h-5 ${isSelected ? 'text-brand-600' : 'text-kitchen-500'}`} />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{table.name}</p>
                        <p className={`text-xs mt-0.5 ${isFree ? 'text-kitchen-600' : 'text-red-500'}`}>
                          {isFree ? 'Disponible' : 'Occupee'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Estimated wait for occupied tables */}
                {occupiedTables.length > 0 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Tables occupees</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Les tables occupees seront disponibles sous environ 15-30 min. Vous pouvez aussi commander a emporter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Emporter info */}
        {mode === 'emporter' && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-ocean-50 border border-ocean-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-ocean-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ocean-800">Commande a emporter</p>
                    <p className="text-xs text-ocean-600 mt-0.5">
                    Vous commandez maintenant, votre plat sera pret quand vous arrivez. Pas besoin d'attendre sur place !
                    Temps estime : ~{restaurant?.avgPrep ?? 18} minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue button */}
        {mode && (
          <div className="animate-fade-in">
            <button
              onClick={handleContinue}
              disabled={mode === 'sur_place' && !selectedTable}
              className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95 ${
                mode === 'sur_place' && !selectedTable
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/25'
              }`}
            >
              {mode === 'sur_place'
                ? selectedTable
                  ? 'Voir le menu et commander'
                  : 'Selectionnez une table'
                : 'Voir le menu et commander'}
            </button>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
