import { Plus, Clock } from 'lucide-react';
import { resolveMediaUrl } from '../services/api';

const FALLBACK_PRODUCT_IMAGE = 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  image_url: string;
  available: boolean;
}

interface CardProduitProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function CardProduit({ product, onAdd }: CardProduitProps) {
  return (
    <div
      className={`card group ${
        !product.available ? 'opacity-60' : ''
      }`}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          src={resolveMediaUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{product.prep_time_minutes} min</span>
        </div>
        {!product.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-sm font-semibold px-4 py-1.5 rounded-full">
              Indisponible
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-gray-900 leading-tight">{product.name}</h3>
          <span className="text-brand-600 font-bold text-lg whitespace-nowrap">
            {product.price.toLocaleString('fr-FR')} F
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        {product.available && (
          <button
            onClick={() => onAdd(product)}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
