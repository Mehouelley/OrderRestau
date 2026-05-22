import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, UtensilsCrossed, ShoppingBag, Clock, MapPin } from 'lucide-react';
import CardProduit from '../../components/CardProduit';
import PanierFloating from '../../components/PanierFloating';
import { useCartStore } from '../../contexts/CartContext';
import { api } from '../../services/api';

export default function MenuDigital() {
  const { restaurantSlug, tableId } = useParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurant, setRestaurant] = useState<{ name: string; avgPrep?: number } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string | null>(null);
  const [tableContext, setTableContext] = useState<any | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setOrderType = useCartStore((s) => s.setOrderType);

  const isEmporter = tableId === 'emporter';
  const isFromQR = !!tableId && !isEmporter;

  useEffect(() => {
    api.restaurant.get(restaurantSlug || '').then((res) => {
      if (res.data) setRestaurant(res.data);
    });
    
    // Load categories and products for this restaurant
    if (restaurantSlug) {
      api.categories.list(restaurantSlug).then((res) => {
        if (res.data) setCategories(res.data);
      });
      api.products.list(restaurantSlug).then((res) => {
        if (res.data) setProducts(res.data);
      });
    }

    // If from QR code, load detailed table context.
    if (isFromQR && restaurantSlug) {
      api.tables.context(restaurantSlug, tableId || '').then((res) => {
        if (res.data) {
          setTableContext(res.data);
          if (res.data.table?.name) setTableName(res.data.table.name);
        }
      });
    }
  }, [restaurantSlug, isFromQR, tableId]);

  const isTableOccupied = isFromQR && tableContext?.occupied;

  // Set order type based on how user arrived
  useEffect(() => {
    if (isEmporter) {
      setOrderType('emporter');
    } else if (isFromQR) {
      setOrderType('sur_place');
    }
  }, [isEmporter, isFromQR, setOrderType]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || String(p.category_id) === String(activeCategory);
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = (product: any) => {
    if (isTableOccupied) {
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      prepTime: product.prep_time_minutes,
      image_url: product.image_url,
    });
  };

  return (
    <div className="pb-20 lg:pb-0">
      {/* Hero section */}
      <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=1200')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-brand-200" />
            <span className="text-brand-200 text-sm font-medium">Menu Digital</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            {restaurant?.name || 'Menu Digital'}
          </h1>
          <p className="text-brand-100 text-sm sm:text-base max-w-md">
            Decouvrez nos plats prepares avec passion. Commandez et nous preparons pour vous.
          </p>

          {/* Context badge */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isFromQR && tableName && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-kitchen-400 animate-pulse" />
                <span className="text-sm font-medium">{tableName}</span>
              </div>
            )}
            {isTableOccupied && (
              <div className="inline-flex items-center gap-2 bg-red-500/25 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-300/40">
                <div className="w-2 h-2 rounded-full bg-red-300" />
                <span className="text-sm font-semibold">Table occupee</span>
              </div>
            )}
            {isEmporter && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <ShoppingBag className="w-4 h-4 text-brand-200" />
                <span className="text-sm font-medium">A emporter</span>
              </div>
            )}
            {!tableId && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <MapPin className="w-4 h-4 text-brand-200" />
                <span className="text-sm font-medium">Commande a distance</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <Clock className="w-4 h-4 text-brand-200" />
              <span className="text-sm font-medium">~{restaurant?.avgPrep ?? 18} min en moyenne</span>
            </div>
          </div>
        </div>
      </div>

      {isTableOccupied && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800 mb-1">
              Cette table est deja occupee.
            </p>
            <p className="text-sm text-red-700 mb-3">
              Precommandeur: {tableContext?.preordered_by?.name || tableContext?.preordered_by?.phone || 'Non renseigne'}
            </p>
            <div className="space-y-2">
              {(tableContext?.active_orders || []).length === 0 ? (
                <p className="text-sm text-red-700">Aucune commande active pour le moment.</p>
              ) : (
                tableContext.active_orders.map((order: any) => (
                  <div key={order.id} className="rounded-xl bg-white border border-red-100 p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Commande #{order.id} - {order.status}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Client: {order.customer_name || order.customer_phone || 'Non renseigne'}</p>
                    <p className="text-xs text-gray-600">
                      {(order.items || []).map((item: any) => `${item.quantity}x ${item.product_name}`).join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="sticky top-[57px] z-30 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(String(cat.id))}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === String(cat.id)
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 stroke-1" />
            <p>Aucun plat trouve</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <CardProduit key={product.id} product={product} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      {/* Floating cart */}
      {!isTableOccupied && <PanierFloating />}
    </div>
  );
}
