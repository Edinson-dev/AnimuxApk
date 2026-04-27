import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Film, Tv, Save, LayoutGrid, ChevronDown, Edit3, AlertCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, setDoc, doc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { camouflageURL } from '../config/servers';

export default function AdminPanel({ onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('channels');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [shouldCamouflage, setShouldCamouflage] = useState(false);
  const [formData, setFormData] = useState({
    name: '', title: '', url: '', logo: '', category: '', description: '', year: '', rating: 9.0, featured: false, isNew: true
  });

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const catSnapshot = await getDocs(collection(db, 'categories'));
      const manualCats = catSnapshot.docs.map(doc => doc.data().name);
      // Las categorías base son fijas, pero permitimos que las de la nube se sumen
      const baseCats = ['Series', 'Películas', 'Deportes', 'Anime', 'Infantil', 'Música'];
      const finalCats = Array.from(new Set([...baseCats, ...manualCats]));
      setCategories(finalCats.sort());
      if (!formData.category && finalCats.length > 0) setFormData(prev => ({ ...prev, category: finalCats[0] }));
    } catch (err) {
      const cached = localStorage.getItem('animux_cache_cats');
      if (cached) setCategories(JSON.parse(cached));
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, activeTab));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setItems(data);
    } catch (err) {
      const cached = activeTab === 'channels' ? localStorage.getItem('animux_cache_chans') : localStorage.getItem('animux_cache_movs');
      if (cached) setItems(JSON.parse(cached).filter(i => i.fromCloud));
    } finally { setLoading(false); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      name: item.name || '', title: item.title || '', url: item.url || '',
      logo: item.logo || '', category: item.category || categories[0],
      description: item.description || '', year: item.year || '',
      featured: item.featured || false, isNew: item.isNew !== undefined ? item.isNew : true
    });
    setShowAddForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const collectionName = activeTab;
      let docId = editingId || (activeTab === 'channels' ? formData.name : formData.title);
      if (activeTab === 'categories') docId = editingId || formData.name;

      const cleanId = docId.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      if (!cleanId) return alert("ID inválido");

      const dataToSave = activeTab === 'categories'
        ? { name: formData.name.trim() }
        : { 
            ...formData, 
            url: shouldCamouflage ? camouflageURL(formData.url) : formData.url,
            isVOD: activeTab === 'movies', 
            updatedAt: Date.now() 
          };

      await setDoc(doc(db, collectionName, cleanId), dataToSave);

      // If item is re-added, remove from blocklist
      const reName = (formData.name || formData.title || '').toLowerCase().trim();
      if (reName) {
        const bl = JSON.parse(localStorage.getItem('animux_deleted') || '[]');
        const updated = bl.filter(n => n !== reName);
        localStorage.setItem('animux_deleted', JSON.stringify(updated));
      }

      // Clear caches
      localStorage.removeItem('animux_cache_chans');
      localStorage.removeItem('animux_cache_movs');
      localStorage.removeItem('animux_cache_cats');
      localStorage.removeItem('animux_last_fetch');

      setShowAddForm(false);
      setEditingId(null);
      setShouldCamouflage(false);
      setFormData({ name: '', title: '', url: '', logo: '', category: categories[0] || '', description: '', year: '', rating: 9.0, featured: false, isNew: true });
      fetchItems();
      fetchCategories();
      if (onUpdate) onUpdate();
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este elemento?')) {
      try {
        // Get item before deleting to store name in blocklist
        const item = items.find(i => i.id === id);
        await deleteDoc(doc(db, activeTab, id));

        // Add to local blocklist so channels.json duplicates are also hidden
        if (item) {
          const deletedName = (item.name || item.title || '').toLowerCase().trim();
          if (deletedName) {
            const bl = JSON.parse(localStorage.getItem('animux_deleted') || '[]');
            if (!bl.includes(deletedName)) {
              localStorage.setItem('animux_deleted', JSON.stringify([...bl, deletedName]));
            }
          }
        }

        // Clear ALL caches so next load fetches fresh data from Firebase
        localStorage.removeItem('animux_cache_chans');
        localStorage.removeItem('animux_cache_movs');
        localStorage.removeItem('animux_cache_cats');
        localStorage.removeItem('animux_last_fetch');

        fetchItems();
        fetchCategories();
        if (onUpdate) onUpdate();
      } catch (e) { alert('Error al eliminar: ' + e.message); }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#121212] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-scale-up">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-600 rounded-2xl"><Tv className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Administración</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gestiona tu contenido en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (window.confirm('¿Deseas restaurar todos los canales reportados como caídos?')) {
                  localStorage.removeItem('animux_broken');
                  window.location.reload();
                }
              }}
              title="Restaurar canales caídos"
              className="p-2 hover:bg-rose-600/20 text-gray-500 hover:text-rose-500 rounded-full transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter"
            >
              <AlertCircle className="w-4 h-4" /> Reset Broken
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all"><X className="w-6 h-6 text-gray-400" /></button>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 border-b border-white/5">
          <div className="flex bg-white/5 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {['channels', 'movies', 'categories'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                {tab === 'channels' ? 'Canales TV' : tab === 'movies' ? 'Películas' : 'Categorías'}
              </button>
            ))}
          </div>
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none" />
          </div>
          <button onClick={() => { setEditingId(null); setShouldCamouflage(false); setFormData({ name: '', title: '', url: '', logo: '', category: categories[0] || '', description: '', year: '', rating: 9.0, featured: false, isNew: true }); setShowAddForm(true); }} className="w-full md:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4"><div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cargando...</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.filter(i => (i.name || i.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                <div key={item.id} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4">
                    {activeTab !== 'categories' ? <img src={item.logo} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" /> : <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center"><LayoutGrid className="w-6 h-6 text-rose-500" /></div>}
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{item.name || item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {item.isNew && <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">NUEVO</span>}
                        {item.category && <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{item.category}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(item)} className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/95 z-[110] p-8 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingId ? 'Editar' : 'Añadir'}</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6 text-white" /></button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {activeTab === 'categories' ? (
                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre de la Categoría</label>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Terror, Acción..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre / Título</label>
                      <input required value={activeTab === 'channels' ? formData.name : formData.title} onChange={(e) => setFormData({ ...formData, [activeTab === 'channels' ? 'name' : 'title']: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL Stream</label><input required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>
                    <div className="space-y-2 relative"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoría</label><div className="relative"><select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold appearance-none outline-none cursor-pointer focus:border-rose-600">{categories.map(cat => <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" /></div></div>
                    <div className="space-y-2 col-span-full"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL Logo</label><input required value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>

                    <div className="flex flex-col gap-4 col-span-full bg-white/5 p-6 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="isNew" checked={formData.isNew} onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })} className="w-5 h-5 accent-green-500" />
                        <label htmlFor="isNew" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Marcar como NUEVO (Solo aparecerá en pestaña NUEVOS)</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 accent-rose-600" />
                        <label htmlFor="featured" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Marcar como DESTACADO</label>
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-2">
                        <input type="checkbox" id="camouflage" checked={shouldCamouflage} onChange={(e) => setShouldCamouflage(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                        <label htmlFor="camouflage" className="text-[10px] font-black text-blue-400 uppercase tracking-widest cursor-pointer">Proteger Enlace (Camuflaje de seguridad)</label>
                      </div>
                    </div>
                  </>
                )}
                <button type="submit" className="col-span-full py-5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-rose-700"><Save className="w-5 h-5 inline mr-2" /> {editingId ? 'Actualizar' : 'Guardar'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
