import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Film, Tv, Save, LayoutGrid, ChevronDown, Edit3, AlertCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc, setDoc, doc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { camouflageURL } from '../../config/servers';
import { sendTelegramMessage, saveTelegramConfig, getTelegramConfig, escapeHTML } from '../../config/telegram';

export default function AdminPanel({ onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('channels');
  const [announcement, setAnnouncement] = useState({
    text: `🚀 <b>MANTENIMIENTO FINALIZADO: MÁS RENDIMIENTO</b>\n\nHola a todos. Hemos completado la actualización de nuestros <b>servidores proxy</b> para garantizarles la mejor fluidez en canales premium.\n\n✅ <b>Mejoras aplicadas:</b>\n• Estabilidad total en Caracol HD y ESPN.\n• Carga de video mucho más rápida.\n• Menor consumo de datos móviles.\n\n¡Gracias por ser parte de Animux! 🎬✨`,
    image: '',
    btnText: '🚀 ABRIR ANIMUX',
    btnUrl: window.location.origin
  });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [shouldCamouflage, setShouldCamouflage] = useState(false);
  const [shouldAnnounce, setShouldAnnounce] = useState(true);
  const [tgConfig, setTgConfig] = useState(getTelegramConfig());
  const [formData, setFormData] = useState({
    name: '', title: '', url: '', logo: '', category: '', description: '', year: '', rating: 9.0, featured: false, isNew: true, isVOD: false, direct: false, groupId: '', season: 1,
    tgBtnText: '🚀 VER AHORA', tgBtnUrl: window.location.origin
  });

  // TMDB Integration
  const TMDB_API_KEY = '8b79252f3cf2970ec001895a21ef9db8';
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);

  const fetchTMDB = async () => {
    const queryTerm = activeTab === 'channels' ? formData.name : formData.title;
    if (!queryTerm || queryTerm.length < 2) return;
    
    setIsSearchingTMDB(true);
    try {
      // Buscamos tanto en películas como en series dependiendo del contexto o ambos
      const type = formData.isVOD ? (formData.groupId ? 'tv' : 'movie') : 'movie';
      const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(queryTerm)}`);
      const data = await response.json();
      setTmdbResults(data.results || []);
    } catch (err) {
      console.error("Error TMDB:", err);
    } finally {
      setIsSearchingTMDB(false);
    }
  };

  const selectTMDBResult = (result) => {
    const title = result.title || result.name;
    const year = (result.release_date || result.first_air_date || '').substring(0, 4);
    const poster = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : formData.logo;
    const rating = result.vote_average ? result.vote_average.toFixed(1) : formData.rating;
    
    setFormData(prev => ({
      ...prev,
      [activeTab === 'channels' ? 'name' : 'title']: title,
      description: result.overview || prev.description,
      year: year || prev.year,
      logo: poster,
      rating: rating,
      isVOD: result.media_type === 'tv' || result.media_type === 'movie' ? true : prev.isVOD,
      groupId: result.media_type === 'tv' ? title.replace(/\s+/g, '-') : prev.groupId
    }));
    setTmdbResults([]);
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const catSnapshot = await getDocs(collection(db, 'categories'));
      const manualCats = catSnapshot.docs.map(doc => doc.data().name);
      // Las categorías base son fijas, pero permitimos que las de la nube se sumen
      const baseCats = ['Series', 'Películas', 'Cine', 'Deportes', 'Noticias', 'Documentales', 'Nacionales', 'Infantil', 'Música', 'Anime', 'General'];
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
      featured: item.featured || false, isNew: item.isNew !== undefined ? item.isNew : true,
      isVOD: item.isVOD || false, direct: item.direct || false, groupId: item.groupId || '', season: item.season || 1,
      tgBtnText: item.tgBtnText || '🚀 VER AHORA', tgBtnUrl: item.tgBtnUrl || window.location.origin
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
            isVOD: formData.isVOD, 
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

      // Anuncio en Telegram
      if (shouldAnnounce && activeTab !== 'categories') {
        const isSerie = formData.isVOD && formData.groupId;
        
        // Determinar el género gramatical y el tipo de contenido para profesionalismo
        let typeLabel = '';
        if (isSerie) {
          typeLabel = `EPISODIO ${editingId ? 'ACTUALIZADO' : 'NUEVO'}`;
        } else if (activeTab === 'channels') {
          typeLabel = `CANAL ${editingId ? 'ACTUALIZADO' : 'NUEVO'}`;
        } else {
          typeLabel = `PELÍCULA ${editingId ? 'ACTUALIZADA' : 'NUEVA'}`;
        }

        const title = escapeHTML(formData.name || formData.title);
        const category = escapeHTML(formData.category);
        const year = escapeHTML(formData.year);
        const season = escapeHTML(formData.season);
        const rating = formData.rating || '9.0';
        const description = escapeHTML(formData.description);
        
        const msg = `🌟 <b>¡${typeLabel} DISPONIBLE!</b> 🌟\n` +
                    `──────────────────\n\n` +
                    `🍿 <b>Título:</b> ${title}\n` +
                    `📂 <b>Categoría:</b> ${category}\n` +
                    (year ? `📅 <b>Año:</b> ${year}\n` : '') +
                    (isSerie && season ? `📁 <b>Temporada:</b> ${season}\n` : '') +
                    `⭐ <b>Puntuación:</b> ${rating}/10\n` +
                    (description ? `\n📝 <b>Sinopsis:</b>\n<i>${description}</i>\n` : '') +
                    `\n──────────────────\n` +
                    `📲 <b>¡Disfrútala ahora en Animux!</b> 🚀`;
        
        // Solo deshabilitar el botón si la URL de destino es localhost (Telegram lo rechazaría)
        const targetUrl = formData.tgBtnUrl || window.location.origin;
        const isLocalUrl = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
        
        const button = isLocalUrl ? null : {
          text: formData.tgBtnText || '🚀 VER AHORA',
          url: targetUrl
        };

        sendTelegramMessage(msg, formData.logo, button);
      }

      setShowAddForm(false);
      setEditingId(null);
      setShouldCamouflage(false);
      setFormData({ name: '', title: '', url: '', logo: '', category: categories[0] || '', description: '', year: '', rating: 9.0, featured: false, isNew: true, isVOD: false, direct: false, groupId: '', season: 1, tgBtnText: '🚀 VER AHORA', tgBtnUrl: window.location.origin });
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-6xl h-full md:h-[90vh] bg-[#0a0a0a] md:border md:border-white/5 md:rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-scale-up">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black z-[120]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl"><Tv className="w-5 h-5 text-white" /></div>
            <h2 className="text-sm font-black uppercase tracking-tighter text-white">Animux Admin</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white bg-white/5 rounded-xl">
             {isMobileMenuOpen ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-0 md:inset-auto z-[115] md:z-0
          w-72 bg-black md:bg-black/40 border-r border-white/5 
          flex flex-col p-6 gap-8 
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="hidden md:flex items-center gap-4 px-2">
            <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/20"><Tv className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">Animux</h2>
              <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Admin Panel</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1 pt-12 md:pt-0">
            {[
              { id: 'channels', label: 'Canales TV', icon: Tv },
              { id: 'movies', label: 'Películas', icon: Film },
              { id: 'categories', label: 'Categorías', icon: LayoutGrid },
              { id: 'announcements', label: 'Anuncios', icon: AlertCircle },
              { id: 'config', label: 'Configuración', icon: Save },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); setEditingId(null); setIsMobileMenuOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-rose-500'} transition-colors`} />
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 hover:text-white transition-all">
            <X className="w-4 h-4" /> Salir del Panel
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/[0.01] overflow-hidden">

          
          {/* Header Bar */}
          <div className="p-4 md:p-8 pb-4 flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                  {activeTab === 'channels' ? 'Gestión de Canales' : 
                   activeTab === 'movies' ? 'Películas y Series' : 
                   activeTab === 'categories' ? 'Categorías del Sistema' : 
                   activeTab === 'announcements' ? 'Anuncios Globales' : 'Ajustes del Bot'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                  {items.length} elementos registrados actualmente
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (window.confirm('¿Deseas restaurar todos los canales reportados como caídos?')) {
                      localStorage.removeItem('animux_broken');
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-widest border border-white/5"
                >
                  <AlertCircle className="w-3 h-3" /> Reset Broken
                </button>
              </div>
            </div>


            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-rose-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="FILTRAR POR NOMBRE..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-rose-600/50 rounded-2xl py-3 md:py-3.5 pl-12 pr-4 text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest outline-none transition-all placeholder:text-gray-700" 
                />
              </div>
              {activeTab !== 'categories' && activeTab !== 'config' && activeTab !== 'announcements' && (
                <div className="relative w-full md:w-64 group">
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)} 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 md:py-3.5 pl-4 pr-10 text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest appearance-none outline-none cursor-pointer"
                  >
                    <option value="">TODAS LAS CATEGORÍAS</option>
                    {categories.map(cat => <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              )}
              {activeTab !== 'config' && activeTab !== 'announcements' && (
                <button onClick={() => { setEditingId(null); setShouldCamouflage(false); setFormData({ name: '', title: '', url: '', logo: '', category: categories[0] || '', description: '', year: '', rating: 9.0, featured: false, isNew: true, isVOD: false, direct: false, groupId: '', season: 1 }); setShowAddForm(true); }} className="w-full md:w-auto px-8 py-3 md:py-3.5 bg-white text-black hover:bg-rose-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                  <Plus className="w-4 h-4" /> Nuevo
                </button>
              )}
            </div>

          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-2 no-scrollbar">

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4"><div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cargando...</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activeTab === 'announcements' ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-8 animate-fade-in max-w-3xl mx-auto w-full">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Enviar Anuncio Global</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      Este mensaje se enviará a través de tu Bot a todos los miembros de tu grupo de Telegram.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mensaje (Soporta HTML)</label>
                      <textarea 
                        rows="8"
                        value={announcement.text} 
                        onChange={(e) => setAnnouncement({...announcement, text: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Imagen URL (Opcional)</label>
                        <input 
                          type="text" 
                          value={announcement.image} 
                          onChange={(e) => setAnnouncement({...announcement, image: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Texto del Botón</label>
                        <input 
                          type="text" 
                          value={announcement.btnText} 
                          onChange={(e) => setAnnouncement({...announcement, btnText: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">URL del Botón</label>
                        <input 
                          type="text" 
                          value={announcement.btnUrl} 
                          onChange={(e) => setAnnouncement({...announcement, btnUrl: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={async () => {
                          if (!announcement.text.trim()) return alert("Escribe un mensaje");
                          
                          // Telegram no permite URLs de localhost
                          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                          const button = (announcement.btnText && !isLocal) 
                            ? { text: announcement.btnText, url: announcement.btnUrl } 
                            : null;

                          const ok = await sendTelegramMessage(
                            announcement.text, 
                            announcement.image || null, 
                            button
                          );
                          if (ok) alert("✅ Anuncio enviado correctamente.");
                        }}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                      >
                        Enviar Anuncio Ahora
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'config' ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-8 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Configuración de Telegram Bot</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      Conecta un Bot de Telegram para recibir alertas de fallos y anunciar nuevos contenidos automáticamente en tu grupo.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Bot Token (@BotFather)</label>
                      <input 
                        type="password" 
                        value={tgConfig.botToken} 
                        onChange={(e) => setTgConfig({...tgConfig, botToken: e.target.value})}
                        placeholder="Ej: 123456789:ABCDefgh..."
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Chat ID (Grupo Público)</label>
                      <input 
                        type="text" 
                        value={tgConfig.chatId} 
                        onChange={(e) => setTgConfig({...tgConfig, chatId: e.target.value})}
                        placeholder="Ej: -100123456789"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-rose-400/70 uppercase tracking-widest px-1 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> ID Personal (Alertas de Fallos)
                      </label>
                      <input 
                        type="text" 
                        value={tgConfig.adminChatId || ''} 
                        onChange={(e) => setTgConfig({...tgConfig, adminChatId: e.target.value})}
                        placeholder="Tu ID personal para recibir reportes de links caídos"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 transition-all"
                      />
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest px-1">Si dejas esto en blanco, los reportes se enviarán al grupo.</p>
                    </div>
                    
                    <div className="pt-4 flex gap-4">
                      <button 
                        onClick={() => {
                          saveTelegramConfig(tgConfig.botToken, tgConfig.chatId, tgConfig.adminChatId);
                          alert("✅ Configuración de Telegram guardada correctamente.");
                        }}
                        className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20"
                      >
                        Guardar Configuración
                      </button>
                      <button 
                        onClick={async () => {
                          const ok = await sendTelegramMessage("🔔 <b>PRUEBA DE CONEXIÓN</b>\n\nTu bot de Animux está configurado correctamente. ¡Listo para enviar notificaciones! 🚀");
                          if (ok) alert("✅ Mensaje de prueba enviado con éxito.");
                          else alert("❌ Error al enviar mensaje. Revisa el Token y ChatID.");
                        }}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                      >
                        Probar
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-rose-600/5 rounded-2xl border border-rose-600/10 space-y-3">
                    <div className="flex items-center gap-2 text-rose-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">¿Cómo obtener estos datos?</span>
                    </div>
                    <ul className="text-[9px] text-gray-500 font-bold uppercase tracking-wider space-y-2 list-disc pl-4">
                      <li>Crea un bot hablando con <b>@BotFather</b> en Telegram.</li>
                      <li>Agrégalo como Administrador a tu grupo.</li>
                      <li>Obtén el ID de tu grupo enviando un mensaje al bot y revisando <code>https://api.telegram.org/bot[TOKEN]/getUpdates</code>.</li>
                    </ul>
                  </div>
                </div>
              ) : items
                .filter(i => (i.name || i.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .filter(i => filterCategory === '' || i.category === filterCategory)
                .map(item => (
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
                  <div className="flex items-center gap-2 transition-all">
                    <button onClick={() => handleEdit(item)} className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Editar"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/95 z-[110] p-4 md:p-8 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">

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
                      <div className="flex gap-2">
                        <input 
                          required 
                          value={activeTab === 'channels' ? formData.name : formData.title} 
                          onChange={(e) => setFormData({ ...formData, [activeTab === 'channels' ? 'name' : 'title']: e.target.value })} 
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" 
                        />
                        <button 
                          type="button"
                          onClick={fetchTMDB}
                          disabled={isSearchingTMDB}
                          className="px-6 bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-600/30"
                        >
                          {isSearchingTMDB ? '...' : '🔍 Buscar Info'}
                        </button>
                      </div>
                      
                      {/* Resultados de búsqueda TMDB */}
                      {tmdbResults.length > 0 && (
                        <div className="mt-2 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-h-60 overflow-y-auto no-scrollbar">
                          {tmdbResults.map(res => (
                            <div 
                              key={res.id} 
                              onClick={() => selectTMDBResult(res)}
                              className="p-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                            >
                              <img src={res.poster_path ? `https://image.tmdb.org/t/p/w92${res.poster_path}` : 'https://via.placeholder.com/92x138'} className="w-10 h-14 rounded-lg object-cover" alt="" />
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[10px] font-black text-white uppercase truncate">{res.title || res.name}</h5>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                  {res.media_type === 'tv' ? '📺 Serie' : '🎬 Película'} • {(res.release_date || res.first_air_date || '').substring(0, 4)}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 text-rose-500" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL Stream</label><input required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>
                    <div className="space-y-2 relative"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoría</label><div className="relative"><select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold appearance-none outline-none cursor-pointer focus:border-rose-600">{categories.map(cat => <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" /></div></div>
                    <div className="space-y-2 col-span-full"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">URL Logo / Poster</label><input required value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>
                    <div className="space-y-2 col-span-full"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción / Sinopsis</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600 resize-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Año</label><input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Puntuación (TMDB)</label><input type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" /></div>

                    <div className="flex flex-col gap-4 col-span-full bg-white/5 p-6 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="isNew" checked={formData.isNew} onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })} className="w-5 h-5 accent-green-500" />
                        <label htmlFor="isNew" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Marcar como NUEVO (Solo aparecerá en pestaña NUEVOS)</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-5 h-5 accent-rose-600" />
                        <label htmlFor="featured" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Marcar como DESTACADO</label>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-white/5 mt-2">
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Configuración Especial (Series / VOD)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" id="isVOD" checked={formData.isVOD} onChange={(e) => setFormData({ ...formData, isVOD: e.target.checked })} className="w-5 h-5 accent-purple-500" />
                            <label htmlFor="isVOD" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Es Contenido VOD (Película / Serie)</label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" id="direct" checked={formData.direct} onChange={(e) => setFormData({ ...formData, direct: e.target.checked })} className="w-5 h-5 accent-green-500" />
                            <label htmlFor="direct" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Directo (Bypass Proxy. Para archivos .mp4 pesados)</label>
                          </div>
                        </div>
                        {formData.isVOD && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID del Grupo (Serie)</label>
                              <input value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value })} placeholder="Ej: DBZ-Cloverway-Episodes" className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temporada (Número)</label>
                              <input type="number" min="1" value={formData.season} onChange={(e) => setFormData({ ...formData, season: parseInt(e.target.value) || 1 })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-2">
                        <input type="checkbox" id="camouflage" checked={shouldCamouflage} onChange={(e) => setShouldCamouflage(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                        <label htmlFor="camouflage" className="text-[10px] font-black text-blue-400 uppercase tracking-widest cursor-pointer">Proteger Enlace (Camuflaje de seguridad)</label>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5 mt-2">
                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">Personalizar Botón Telegram</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Texto del Botón</label>
                            <input value={formData.tgBtnText} onChange={(e) => setFormData({ ...formData, tgBtnText: e.target.value })} placeholder="Ej: 🚀 VER AHORA" className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Enlace del Botón</label>
                            <input value={formData.tgBtnUrl} onChange={(e) => setFormData({ ...formData, tgBtnUrl: e.target.value })} placeholder="https://..." className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none focus:border-rose-600" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-2">
                        <input type="checkbox" id="announce" checked={shouldAnnounce} onChange={(e) => setShouldAnnounce(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                        <label htmlFor="announce" className="text-[10px] font-black text-orange-400 uppercase tracking-widest cursor-pointer">
                          {editingId ? 'Volver a anunciar en Telegram' : 'Anunciar en Telegram (Grupo Comunidad)'}
                        </label>
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
    </div>
  );
}
