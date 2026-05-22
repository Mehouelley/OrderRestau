import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';

interface Product {
  id: string | number;
  category_id: string | number;
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  image_url: string;
  available?: boolean;
}

interface Category {
  id: string | number;
  name: string;
  sort_order?: number;
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState<string | number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    prep_time_minutes: '',
    image_url: '',
  });

  // Load categories and products on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.categories.list(),
        api.products.list(),
      ]);
      
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      
      if (catRes.data && catRes.data.length > 0) {
        setExpandedCat(catRes.data[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const reloadProducts = async () => {
    const prodRes = await api.products.list();
    if (prodRes.data) setProducts(prodRes.data);
  };

  const toggleCategory = (catId: string | number) => {
    setExpandedCat(expandedCat === catId ? null : catId);
  };

  const toggleAvailability = async (productId: string | number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    
    const newAvailable = !product.available;
    const result = await api.products.update(String(productId), {
      available: newAvailable,
    });
    
    if (result.data) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, available: newAvailable } : p))
      );
    }
  };

  const deleteProduct = async (productId: string | number) => {
    const result = await api.products.delete(String(productId));
    if (!result.error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleProductImageChange = (file: File | null) => {
    if (productImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(productImagePreview);
    }

    setProductFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProductImagePreview(previewUrl);
    } else {
      setProductImagePreview(resolveMediaUrl(productForm.image_url));
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const result = await api.categories.create({
      name: newCategoryName,
    });
    
    if (result.data) {
      setCategories((prev) => [...prev, result.data]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const addProduct = async (categoryId: string | number) => {
    if (!productForm.name.trim() || !productForm.price) return;
    
    const result = await api.products.create({
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price) || 0,
      prep_time_minutes: parseInt(productForm.prep_time_minutes) || 15,
      image_url: productForm.image_url || 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400',
      image: productFile,
      category_id: categoryId,
    });
    
    if (result.data) {
      await reloadProducts();
      setProductForm({ name: '', description: '', price: '', prep_time_minutes: '', image_url: '' });
      setProductFile(null);
      setProductImagePreview('');
      setShowAddProduct(null);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      prep_time_minutes: product.prep_time_minutes.toString(),
      image_url: product.image_url,
    });
    setProductImagePreview(resolveMediaUrl(product.image_url));
    setProductFile(null);
  };

  const saveEdit = async () => {
    if (!editingProduct) return;
    
    const result = await api.products.update(String(editingProduct.id), {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price) || 0,
      prep_time_minutes: parseInt(productForm.prep_time_minutes) || 15,
      image_url: productForm.image_url,
      image: productFile,
    });
    
    if (result.data) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name,
                description: productForm.description,
                price: parseFloat(productForm.price) || p.price,
                prep_time_minutes: parseInt(productForm.prep_time_minutes) || p.prep_time_minutes,
                image_url: result.data.image_url || p.image_url,
              }
            : p
        )
      );
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', prep_time_minutes: '', image_url: '' });
      setProductFile(null);
      setProductImagePreview('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Gestion du Menu</h1>
        <button
          onClick={() => setShowAddCategory(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle categorie
        </button>
      </div>

      {/* Add category modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddCategory(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nouvelle categorie</h2>
              <button onClick={() => setShowAddCategory(false)} className="p-1 hover:bg-gray-100 rounded-lg" title="Fermer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nom de la categorie"
              className="input-field mb-4"
              autoFocus
            />
            <button onClick={addCategory} className="btn-primary w-full text-center">
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Edit product modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Modifier le plat</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  handleProductImageChange(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProductImageChange(e.target.files?.[0] || null)}
                  placeholder="Modifier l'image"
                  className="input-field pl-10"
                  title="Importer une nouvelle image"
                />
              </div>
              {productImagePreview && (
                <img
                  src={productImagePreview}
                  alt="Aperçu"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
              )}
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nom du plat"
                className="input-field"
              />
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Description"
                className="input-field resize-none h-20"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="Prix (FCFA)"
                  className="input-field"
                />
                <input
                  type="number"
                  value={productForm.prep_time_minutes}
                  onChange={(e) => setProductForm({ ...productForm, prep_time_minutes: e.target.value })}
                  placeholder="Temps (min)"
                  className="input-field"
                />
              </div>
            </div>
            <button onClick={saveEdit} className="btn-primary w-full text-center mt-4">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const isExpanded = expandedCat === cat.id;

        return (
          <div key={cat.id} className="card">
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{cat.name}</span>
                <span className="text-xs text-gray-400">({catProducts.length} plats)</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100">
                {catProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <img
                      src={resolveMediaUrl(product.image_url)}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${!product.available ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{product.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-600 whitespace-nowrap">
                      {product.price.toLocaleString('fr-FR')} F
                    </span>
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      className="flex-shrink-0"
                      title={product.available ? 'Rendre indisponible' : 'Rendre disponible'}
                    >
                      {product.available ? (
                        <ToggleRight className="w-7 h-7 text-kitchen-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(product)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}

                {/* Add product form */}
                {showAddProduct === cat.id ? (
                  <div className="px-5 py-4 bg-gray-50/50 space-y-3">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleProductImageChange(e.target.files?.[0] || null)}
                        placeholder="Image du plat"
                        className="input-field pl-10 text-sm"
                        title="Importer l'image du plat"
                      />
                    </div>
                    {productImagePreview && (
                      <img
                        src={productImagePreview}
                        alt="Aperçu"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Nom du plat"
                      className="input-field text-sm"
                    />
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Description"
                      className="input-field text-sm resize-none h-16"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="Prix (FCFA)"
                        className="input-field text-sm"
                      />
                      <input
                        type="number"
                        value={productForm.prep_time_minutes}
                        onChange={(e) => setProductForm({ ...productForm, prep_time_minutes: e.target.value })}
                        placeholder="Temps (min)"
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addProduct(cat.id)} className="btn-success text-sm flex-1">
                        Ajouter
                      </button>
                      <button
                        onClick={() => {
                          setShowAddProduct(null);
                          setProductForm({ name: '', description: '', price: '', prep_time_minutes: '', image_url: '' });
                          handleProductImageChange(null);
                        }}
                        className="btn-secondary text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3">
                    <button
                      onClick={() => setShowAddProduct(cat.id)}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un plat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
