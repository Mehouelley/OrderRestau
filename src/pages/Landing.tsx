import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UtensilsCrossed, Smartphone, QrCode, ArrowRight, CheckCircle2, Clock, ShoppingCart, MapPin, Star, Users, ShoppingBag } from 'lucide-react';
import { api, resolveMediaUrl } from '../services/api';

export default function Landing() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.restaurant.list().then((res) => {
      if (res.data) setRestaurants(res.data.slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-gray-900">Plateforme de commande</span>
          </div>
          <Link to="/restaurants" className="btn-primary text-sm py-2 px-4">
            Commander
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700" />
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=1200')] bg-cover bg-center opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <QrCode className="w-4 h-4 text-brand-200" />
              <span className="text-sm font-medium text-white/90">Commandez à table sans attendre</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Dinez où vous voulez, <br />
              <span className="text-brand-200">quand vous avez faim</span>
            </h1>
            <p className="text-lg text-brand-100 max-w-lg mb-8">
              Scannez le QR code de la table, commandez via votre téléphone, et payez en ligne. Zéro attente, zéro contact.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/restaurants" className="inline-flex items-center justify-center gap-2 bg-white text-brand-600 font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-50 transition-all duration-200 shadow-lg">
                Découvrir les restaurants
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/restaurants" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium px-6 py-3.5 rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20">
                <Smartphone className="w-4 h-4" />
                Comment ça marche
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
              {[
                { icon: CheckCircle2, title: 'Zero contact', text: 'Pas de serveuse à appeler.' },
                { icon: Clock, title: 'Rapide', text: 'Commandez depuis votre table.' },
                { icon: Star, title: 'Simple', text: 'Menu digital.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-4">
                  <Icon className="w-5 h-5 text-brand-100 mb-3" />
                  <div className="text-white font-semibold text-sm mb-1">{title}</div>
                  <div className="text-brand-100 text-xs leading-relaxed">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Comment ca marche */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Comment ca marche</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">
            4 étapes faciles
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Pas de compte, pas d'attente. Commandez et mangez.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              icon: MapPin,
              title: 'Choisir un resto',
              desc: 'Trouvez votre restaurant préféré.',
              iconBg: 'bg-brand-100',
              iconColor: 'text-brand-600',
            },
            {
              step: '2',
              icon: Users,
              title: 'Réserver une table',
              desc: 'Tables disponibles en temps réel.',
              iconBg: 'bg-ocean-100',
              iconColor: 'text-ocean-600',
            },
            {
              step: '3',
              icon: ShoppingCart,
              title: 'Commander & payer',
              desc: 'Menu digital, paiement en ligne.',
              iconBg: 'bg-kitchen-100',
              iconColor: 'text-kitchen-600',
            },
            {
              step: '4',
              icon: CheckCircle2,
              title: 'Profiter',
              desc: 'Votre commande est prête.',
              iconBg: 'bg-amber-100',
              iconColor: 'text-amber-600',
            },
          ].map(({ step, icon: Icon, title, desc, iconBg, iconColor }) => (
            <div key={step} className="relative card p-6 group hover:shadow-lg transition-shadow duration-300">
              <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="absolute top-4 right-4 text-4xl font-bold text-gray-100">{step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2 modes de commande */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Deux façons de commander</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Sur place ou à emporter
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <Users className="w-14 h-14 text-white/80" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Sur place</h3>
                <ul className="space-y-2">
                  {['Réservez à l\'avance', 'Commandez de votre table', 'Pas d\'attente', 'Appelez en 1 clic'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-kitchen-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center">
                <ShoppingBag className="w-14 h-14 text-white/80" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">À emporter</h3>
                <ul className="space-y-2">
                  {['Commandez en ligne', 'Temps estimé clair', 'Zéro attente', 'Paiement sécurisé'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-kitchen-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Restaurants</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Commandez maintenant
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">Chargement...</div>
          ) : restaurants.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">Aucun restaurant</div>
          ) : (
            restaurants.map((r) => (
              <Link key={r.id || r.slug} to={`/restaurant/${r.slug}`} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg group">
                <div className="h-40 overflow-hidden relative">
                  <img src={resolveMediaUrl(r.image_url) || 'https://images.pexels.com/photos/2608049/pexels-photo-2608049.jpeg?auto=compress&cs=tinysrgb&w=600'} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-1">{r.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {r.address || 'Adresse'}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><Clock className="w-3.5 h-3.5 inline" /> ~{r.avgPrep ?? r.avg_prep_time ?? 20} min</span>
                    <span className="text-kitchen-600">Ouvert</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {restaurants.length > 0 && (
          <div className="mt-8 text-center">
            <Link to="/restaurants" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg">
              Voir tous les restaurants
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à commander ?
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Découvrez les restaurants près de chez vous et commandez votre premier repas.
          </p>
          <Link to="/restaurants" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-50 shadow-lg">
            Découvrir maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base font-semibold text-white">Plateforme</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/restaurants" className="hover:text-white">Restaurants</Link>
            <Link to="/login" className="hover:text-white">Pour restaurateurs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
