import { useState, useEffect } from 'react';
import { Save, Store, Phone, Mail, MapPin, Image as ImageIcon, Lock, Copy, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../contexts/AuthContext';
import { resolveMediaUrl } from '../../services/api';

export default function Parametres() {
  const updateRestaurant = useAuthStore((state) => state.updateRestaurant);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    image_url: '',
    access_code: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.restaurant.me().then((res) => {
      if (res.data) {
        const currentLogo = res.data.image_url || '';
        const resolvedLogo = resolveMediaUrl(currentLogo);
        console.log('[Parametres] Loaded logo:', currentLogo, '→', resolvedLogo);
        
        setForm({
          name: res.data.name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          image_url: currentLogo,
          access_code: res.data.access_code || '1234',
        });
        setLogoPreview(resolvedLogo);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogoChange = (file: File | null) => {
    if (logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    // Validate file size (max 20MB)
    if (file && file.size > 20 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 20 MB)');
      setLogoFile(null);
      setLogoPreview(resolveMediaUrl(form.image_url));
      return;
    }

    setError(null);
    setLogoFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoPreview(resolveMediaUrl(form.image_url));
    }
  };

  const handleSave = () => {
    setError(null);
    api.restaurant.update({
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      access_code: form.access_code || '1234',
      logo: logoFile,
    }).then((res) => {
      if (res.error) {
        setError(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'Une erreur est survenue');
        return;
      }
      
      if (res.data) {
        const resolvedUrl = resolveMediaUrl(res.data.image_url);
        console.log('[Upload] Server returned image_url:', res.data.image_url);
        console.log('[Upload] Resolved to:', resolvedUrl);
        
        setForm((prev) => ({ ...prev, image_url: res.data.image_url || '' }));
        setLogoFile(null);
        setLogoPreview(resolvedUrl);
        updateRestaurant({
          id: res.data.id,
          name: res.data.name,
          slug: res.data.slug,
          owner_id: res.data.owner_id,
          image_url: res.data.image_url,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }).catch((err) => {
      console.error('Save error:', err);
      setError('Une erreur est survenue lors de la sauvegarde');
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(form.access_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = () => {
    const newCode = Math.random().toString().slice(2, 8);
    update('access_code', newCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Parametres</h1>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Informations du restaurant</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Photo du restaurant</label>
            <div className="space-y-3">
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                  title="Importer le logo du restaurant"
                  className="input-field pl-10 pt-2"
                />
              </div>
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Aperçu du restaurant"
                  className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                />
              )}
              <p className="text-xs text-gray-400">
                Importez une image PNG ou JPG. Le logo sera stocké et affiché automatiquement partout dans l’application.
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nom du restaurant</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Nom du restaurant"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telephone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Téléphone du restaurant"
                title="Téléphone du restaurant"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Email du restaurant"
                title="Email du restaurant"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Adresse du restaurant"
                title="Adresse du restaurant"
                className="input-field pl-10 resize-none h-20"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
          {saved && (
            <span className="text-sm text-kitchen-600 font-medium animate-fade-in">
              Modifications enregistrees !
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 font-medium animate-fade-in">
              Erreur: {error}
            </span>
          )}
        </div>
      </div>

      {/* Kitchen access code section */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-600" />
          Code d'acces Ecran Cuisine
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Partagez ce code avec vos cuisiniers pour qu'ils accedent a l'ecran de gestion des commandes.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.access_code}
              readOnly
              title="Code d'acces Ecran Cuisine"
              placeholder="Code d'acces Ecran Cuisine"
              className="input-field font-mono text-lg font-bold tracking-widest text-center"
            />
            <button
              onClick={copyCode}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copier le code"
            >
              <Copy className={`w-5 h-5 transition-colors ${copied ? 'text-kitchen-600' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={generateNewCode}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
              title="Generer un nouveau code"
            >
              <RefreshCw className="w-5 h-5 text-gray-400 hover:text-brand-600" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-kitchen-600 font-medium">Code copie !</p>
          )}
          <p className="text-xs text-gray-400">
            Cliquez sur le bouton "Enregistrer" apres avoir change le code.
          </p>
        </div>
      </div>
    </div>
  );
}
