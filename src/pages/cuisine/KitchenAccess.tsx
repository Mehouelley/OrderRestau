import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export default function KitchenAccess() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.kitchen.access(code);
      
      if (res.data?.restaurant?.slug) {
        // Redirection vers la page cuisine du restaurant
        navigate(`/cuisine/${res.data.restaurant.slug}`);
      } else {
        setError('Erreur lors de l\'accès');
      }
    } catch (err) {
      setError('Code invalide. Veuillez reessayer.');
      console.error('Kitchen access error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Ecran Cuisine</h1>
          <p className="text-gray-400 text-sm mt-1">Entrez le code d'acces ou connectez-vous</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <form onSubmit={handleAccess} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1.5 block">Code d'acces</label>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Entrez le code"
                className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200 text-center text-2xl tracking-[0.5em]"
                maxLength={6}
                autoFocus
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verification...' : 'Acceder'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Ou connectez-vous avec votre compte restaurateur
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full mt-2 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Connexion restaurateur
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          Demandez le code d'acces aupres du restaurateur
        </p>
      </div>
    </div>
  );
}
