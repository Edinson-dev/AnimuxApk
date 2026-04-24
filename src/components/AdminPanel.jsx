import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Film, Tv, Save, AlertCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, setDoc, doc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('channels');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', title: '', url: '', logo: '', category: '', description: '', year: '', rating: 9.0, featured: false
  });

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, activeTab));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setItems(data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const collectionName = activeTab;
      const docId = activeTab === 'channels' ? formData.name : formData.title;
      const cleanId = docId.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      
      const dataToSave = activeTab === 'channels' 
        ? { name: formData.name, url: formData.url, logo: formData.logo, category: formData.category, featured: formData.featured }
        : { ...formData, isVOD: true };

      await setDoc(doc(db, collectionName, cleanId), dataToSave);
      setShowAddForm(false);
      setFormData({ name: '', title: '', url: '', logo: '', category: '', description: '', year: '', rating: 9.0 });
      fetchItems();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este elemento?")) {
      try {
        await deleteDoc(doc(db, activeTab, id));
        fetchItems();
      } catch (err) {
        alert("Error al eliminar");
      }
    }
  };

  const filteredItems = items.filter(item => 
    (item.name || item.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#121212] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-600 rounded-2xl">
               <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Panel de Control</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gestiona tu contenido en tiempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 border-b border-white/5">
          <div className="flex bg-white/5 p-1 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('channels')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'channels' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Canales TV
            </button>
            <button 
              onClick={() => setActiveTab('movies')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'movies' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Películas/VOD
            </button>
          </div>

          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="BUSCAR EN EL PANEL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 focus:border-rose-600/50 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none transition-all"
            />
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full md:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            Añadir Nuevo
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
               <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sincronizando con la nube...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map(item => (
                <div key={item.id} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4">
                    <img src={item.logo} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-xl" alt="" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{item.name || item.title}</h4>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/95 z-[110] p-8 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Añadir {activeTab === 'channels' ? 'Canal' : 'Película'}</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 bg-white/5 rounded-full">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre / Título</label>
                  <input 
                    required
                    value={activeTab === 'channels' ? formData.name : formData.title}
                    onChange={(e) => setFormData({...formData, [activeTab === 'channels' ? 'name' : 'title']: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL del Stream</label>
                  <input 
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoría</label>
                  <input 
                    required
                    placeholder="Ej: Cine, Deportes, Latino..."
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL del Logo (Imagen)</label>
                  <input 
                    required
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                  />
                </div>

                {activeTab === 'movies' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Año</label>
                      <input 
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                      />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all h-32"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 col-span-full bg-white/5 p-4 rounded-2xl border border-white/5">
                  <input 
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="w-5 h-5 accent-rose-600"
                  />
                  <label htmlFor="featured" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">
                    Marcar como DESTACADO (Aparece en el banner principal)
                  </label>
                </div>

                <button 
                  type="submit"
                  className="col-span-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Save className="w-5 h-5" />
                  Guardar en la Nube
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
