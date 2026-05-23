import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Phone, ArrowLeft, CreditCard, Clock, MapPin, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { api } from '../../services/api';

type PaymentMethod = 'fedapay';

export default function Paiement() {
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [method] = useState<PaymentMethod | null>('fedapay');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentError, setPaymentError] = useState('');
  const [order, setOrder] = useState<any>(null);
  const estimatedPrepMinutes = order?.estimated_prep_minutes ?? 20;
  const promisedReadyAt = order?.promised_ready_at ? new Date(order.promised_ready_at) : null;
  const invoiceUrlFromQuery = new URLSearchParams(location.search).get('invoice_url');
  const defaultBackendApiBase = 'https://orderresto-backend.onrender.com/api';

  const getInvoiceUrl = (orderId?: string | number | null) => {
    const rawBase = import.meta.env.VITE_API_URL || defaultBackendApiBase;
    const base = rawBase.replace(/\/$/, '');

    if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) {
      return `${base}/api/orders/${orderId}/invoice`;
    }

    if (base === '/api') {
      return `https://orderresto-backend.onrender.com/api/orders/${orderId}/invoice`;
    }

    return `${base}/orders/${orderId}/invoice`;
  };

  useEffect(() => {
    if (!commandeId) {
      setLoading(false);
      return;
    }
    
    api.orders.getOne(commandeId).then((res) => {
      if (res.data) setOrder(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [commandeId]);

  // Check query params for callback redirect (status, payment_id, invoice_url)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');

    if (status && status === 'approved') {
      setConfirmed(true);
    }
  }, [location.search]);

  const handleConfirm = async () => {
    setLoading(true);
    setPaymentError('');
    try {
      const res = await api.payments.createCheckout({
        order_id: String(commandeId),
        customer_phone: phone || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
      });

      if (res.data && (res.data as any).payment_url) {
        // Redirect user to Fedapay checkout
        window.location.href = (res.data as any).payment_url;
        return;
      }

      if (res.error) {
        setPaymentError(
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.message || 'Une erreur est survenue côté serveur.'
        );
        return;
      }

      setPaymentError('Impossible de lancer le paiement. Veuillez reessayer.');
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Erreur lors de la creation du paiement.');
    } finally {
      setLoading(false);
    }
  };

  if (!order && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Commande non trouvée</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-kitchen-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-kitchen-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-kitchen-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Commande confirmee !
          </h1>
          <p className="text-gray-500 mb-6">
            Votre commande est en cours de preparation.
          </p>

          {/* Estimated time - prominent */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium text-brand-700">Temps estime</span>
            </div>
            <p className="text-3xl font-bold text-brand-600">{estimatedPrepMinutes} min</p>
            <p className="text-xs text-brand-500 mt-1">
              {order?.order_type === 'sur_place'
                ? 'Votre commande sera apportee a votre table'
                : 'Votre commande sera prete quand vous arriverez'}
            </p>
            {promisedReadyAt && (
              <p className="text-xs text-brand-500 mt-2">
                Heure promise : {promisedReadyAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Order details */}
          <div className="card p-5 text-left mb-6">
            <div className="flex items-center gap-2 mb-3">
              {order?.order_type === 'sur_place' ? (
                <>
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span className="text-sm font-medium text-gray-700">{order?.table_name || 'Table'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-ocean-500" />
                  <span className="text-sm font-medium text-gray-700">A emporter</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">Reference</p>
            <p className="font-mono text-sm font-semibold text-gray-900 mb-3">{order?.id}</p>
            <p className="text-sm text-gray-500 mb-1">Moyen de paiement</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">Fedapay</p>
          </div>

          <button
            onClick={() => navigate('/restaurants')}
            className="btn-primary"
          >
            Retour aux restaurants
          </button>
          <div className="mt-4">
            <button
              onClick={() => window.open(invoiceUrlFromQuery || getInvoiceUrl(order?.id), '_blank', 'noopener,noreferrer')}
              className="btn"
            >
              Télécharger la facture
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Paiement en ligne</h1>

        {/* Order context */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <UtensilsCrossed className="w-4 h-4 text-brand-500" />
          <span className="text-gray-600">{order?.restaurant_name || 'Restaurant'}</span>
          {order?.order_type === 'sur_place' ? (
            <span className="flex items-center gap-1 text-brand-600 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {order?.table_name || 'Table'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-ocean-600 font-medium">
              <ShoppingBag className="w-3.5 h-3.5" />
              A emporter
            </span>
          )}
        </div>

        {/* Order recap */}
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Recapitulatif</h2>
          <div className="space-y-2 mb-4">
            {order?.items?.map((item: { quantity: number; product_name: string; unit_price: number }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.product_name}
                </span>
                <span className="font-medium text-gray-900">
                  {(item.unit_price * item.quantity).toLocaleString('fr-FR')} F
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-brand-600 text-lg">
              {order?.total?.toLocaleString('fr-FR') || '0'} F
            </span>
          </div>
        </div>

        {/* Estimated prep time */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Preparation estimee : {estimatedPrepMinutes} minutes
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {order?.order_type === 'sur_place'
                  ? 'Votre commande sera apportee a votre table des qu\'elle est prete.'
                  : `Arrivez au restaurant dans environ ${estimatedPrepMinutes} min, votre commande sera prete.`}
              </p>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Paiement en ligne</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 border-gray-200 bg-white`}>
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Fedapay</span>
              <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Phone number */}
        {method && (
          <>
            <div className="mb-6 animate-fade-in">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Numero de telephone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="77 123 45 67"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nom et prénom</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Prénom Nom"
                className="input-field"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="exemple@domaine.com"
                className="input-field"
              />
            </div>
          </>
        )}

        {/* Confirm button */}
        {paymentError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {paymentError}
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={!method || loading}
          className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95 ${
            !method
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/25'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          ) : (
            'Confirmer le paiement'
          )}
        </button>
      </div>
    </div>
  );
}
