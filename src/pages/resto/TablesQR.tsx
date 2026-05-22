import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Pencil, Trash2, X, Download, QrCode } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../contexts/AuthContext';

interface Table {
  id: string | number;
  name: string;
  status: string;
}

export default function TablesQR() {
  const [tables, setTables] = useState<Table[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editName, setEditName] = useState('');
  const [qrModal, setQrModal] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const restaurant = useAuthStore((s) => s.restaurant);

  // Load tables on mount and setup auto-refresh
  useEffect(() => {
    loadTables();
    
    // Auto-refresh toutes les 10 secondes
    const interval = setInterval(loadTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await api.tables.list();
      if (res.data) {
        setTables(res.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableStatus = async (table: Table) => {
    const newStatus = table.status === 'occupee' ? 'libre' : 'occupee';
    
    try {
      const res = await api.tables.update(String(table.id), { status: newStatus });
      if (res.data) {
        setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: newStatus } : t)));
      }
    } catch (err) {
      console.error('Error updating table status:', err);
    }
  };

  const addTable = async () => {
    if (!newName.trim()) return;
    
    try {
      const res = await api.tables.create({ name: newName });
      if (res.data) {
        setTables((prev) => [...prev, res.data]);
        setNewName('');
        setShowAdd(false);
      }
    } catch (err) {
      console.error('Error adding table:', err);
    }
  };

  const deleteTable = async (id: string | number) => {
    try {
      const res = await api.tables.delete(String(id));
      if (!res.error) {
        setTables((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting table:', err);
    }
  };

  const startEdit = (table: Table) => {
    setEditingId(table.id);
    setEditName(table.name);
  };

  const saveEdit = async (id: string | number) => {
    try {
      const res = await api.tables.update(String(id), { name: editName });
      if (res.data) {
        setTables((prev) => prev.map((t) => (t.id === id ? { ...t, name: editName } : t)));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Error updating table:', err);
    }
  };

  const downloadQR = (table: Table) => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${table.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tables & QR Codes</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-400 mt-1">
              Actualisé à {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadTables} 
            disabled={loading}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Actualiser maintenant"
          >
            ↻ Actualiser
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Ajouter une table
          </button>
        </div>
      </div>

      {/* Add table modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nouvelle table</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="Fermer la fenêtre d'ajout"
                aria-label="Fermer la fenêtre d'ajout"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Table 11, Terrasse 4"
              className="input-field mb-4"
              autoFocus
            />
            <button onClick={addTable} className="btn-primary w-full text-center">
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* QR Code modal */}
      {qrModal && restaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQrModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">QR Code - {qrModal.name}</h2>
              <button
                onClick={() => setQrModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="Fermer la fenêtre QR"
                aria-label="Fermer la fenêtre QR"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 inline-block mb-4">
              <QRCodeSVG
                id={`qr-${qrModal.id}`}
                value={`${baseUrl}/menu/${restaurant.slug}/${qrModal.id}`}
                size={200}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#1f2937"
              />
            </div>
            <p className="text-xs text-gray-400 mb-4 break-all">
              {baseUrl}/menu/{restaurant.slug}/{qrModal.id}
            </p>
            <button
              onClick={() => downloadQR(qrModal)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              Telecharger PNG
            </button>
          </div>
        </div>
      )}

      {/* Tables list */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">QR Code</th>
              <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-5">
                  {editingId === table.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field text-sm py-1.5"
                        placeholder="Nom de la table"
                        title="Modifier le nom de la table"
                        aria-label="Modifier le nom de la table"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(table.id)} className="text-sm text-brand-600 font-medium">
                        OK
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-sm text-gray-400">
                        X
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900">{table.name}</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  <button
                    onClick={() => toggleTableStatus(table)}
                    className={`badge cursor-pointer transition-all ${
                      table.status === 'occupee'
                        ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        : 'bg-kitchen-50 text-kitchen-700 hover:bg-kitchen-100'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        table.status === 'occupee' ? 'bg-brand-400' : 'bg-kitchen-400'
                      }`}
                    />
                    {table.status === 'occupee' ? 'Occupee' : 'Libre'}
                  </button>
                </td>
                <td className="py-3 px-5">
                  <button
                    onClick={() => setQrModal(table)}
                    className="flex items-center gap-1.5 text-sm text-ocean-600 hover:text-ocean-700 font-medium transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    Voir QR
                  </button>
                </td>
                <td className="py-3 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => startEdit(table)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier la table"
                      aria-label="Modifier la table"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer la table"
                      aria-label="Supprimer la table"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
