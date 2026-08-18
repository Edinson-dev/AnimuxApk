import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Film, TrendingUp, X, RotateCcw, ChevronDown, SlidersHorizontal, Check, Sparkles } from 'lucide-react';
import { YEAR_OPTIONS, GENRE_OPTIONS, POPULARITY_OPTIONS } from '../../utils/filters';

export default function FilterControls({
  selectedYear,
  setSelectedYear,
  selectedGenre,
  setSelectedGenre,
  selectedPopularity,
  setSelectedPopularity,
  totalResults,
  onResetFilters,
  className = '',
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'year' | 'genre' | 'popularity' | null
  const containerRef = useRef(null);

  const isFiltered = selectedYear !== 'all' || selectedGenre !== 'all' || selectedPopularity !== 'default';

  const activeFiltersCount = [
    selectedYear !== 'all',
    selectedGenre !== 'all',
    selectedPopularity !== 'default',
  ].filter(Boolean).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  const getYearLabel = () => {
    const opt = YEAR_OPTIONS.find(o => o.value === selectedYear);
    return opt ? opt.label : 'Año';
  };

  const getGenreLabel = () => {
    const opt = GENRE_OPTIONS.find(o => o.value === selectedGenre);
    return opt ? opt.label : 'Género';
  };

  const getPopularityLabel = () => {
    const opt = POPULARITY_OPTIONS.find(o => o.value === selectedPopularity);
    return opt ? opt.label : 'Popularidad';
  };

  // Helper to render current modal / bottom sheet on mobile screens (< 768px)
  const renderMobileModal = () => {
    if (!openDropdown) return null;

    let title = '';
    let options = [];
    let currentVal = '';
    let onSelect = () => {};

    if (openDropdown === 'genre') {
      title = 'Seleccionar Género';
      options = GENRE_OPTIONS;
      currentVal = selectedGenre;
      onSelect = (val) => { setSelectedGenre(val); setOpenDropdown(null); };
    } else if (openDropdown === 'year') {
      title = 'Seleccionar Año';
      options = YEAR_OPTIONS;
      currentVal = selectedYear;
      onSelect = (val) => { setSelectedYear(val); setOpenDropdown(null); };
    } else if (openDropdown === 'popularity') {
      title = 'Ordenar Contenido';
      options = POPULARITY_OPTIONS;
      currentVal = selectedPopularity;
      onSelect = (val) => { setSelectedPopularity(val); setOpenDropdown(null); };
    }

    return (
      <div className="md:hidden fixed inset-0 z-[300] flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
        <div 
          className="absolute inset-0" 
          onClick={() => setOpenDropdown(null)} 
        />
        <div className="relative bg-[#141418] border-t border-white/15 rounded-t-3xl p-5 max-h-[75vh] flex flex-col shadow-2xl z-10 animate-slide-up">
          {/* Drag Handle Indicator */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
            <button 
              onClick={() => setOpenDropdown(null)}
              className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto custom-scrollbar flex-1 py-1 space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                  currentVal === option.value
                    ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30'
                    : 'text-gray-300 hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <span>{option.label}</span>
                {currentVal === option.value && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`w-full space-y-2.5 relative z-40 overflow-visible ${className}`}>
      {/* Main Filter Bar */}
      <div className="p-2 md:p-3 bg-[#0d0d10] border border-white/10 rounded-2xl shadow-xl relative z-30 overflow-visible">
        <div className="flex items-center justify-between gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
          
          {/* Filter Dropdown Buttons */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 md:shrink overflow-visible">
            
            {/* Desktop Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-gray-400 text-xs font-black uppercase tracking-wider shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-scale-in">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            {/* 1. Filtro por Género */}
            <div className="relative shrink-0 overflow-visible">
              <button
                onClick={() => toggleDropdown('genre')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all border shrink-0 ${
                  selectedGenre !== 'all'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate max-w-[90px] sm:max-w-[130px] md:max-w-[160px]">{getGenreLabel()}</span>
                <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${openDropdown === 'genre' ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Popover */}
              {openDropdown === 'genre' && (
                <div className="hidden md:block absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto custom-scrollbar bg-[#141418] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[250] p-1.5 animate-slide-up space-y-0.5">
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-white/10 mb-1">
                    Seleccionar Género
                  </div>
                  {GENRE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedGenre(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                        selectedGenre === option.value
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 font-black'
                          : 'text-gray-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      {selectedGenre === option.value && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Filtro por Año */}
            <div className="relative shrink-0 overflow-visible">
              <button
                onClick={() => toggleDropdown('year')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all border shrink-0 ${
                  selectedYear !== 'all'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px]">{getYearLabel()}</span>
                <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Popover */}
              {openDropdown === 'year' && (
                <div className="hidden md:block absolute top-full left-0 mt-2 w-56 max-h-80 overflow-y-auto custom-scrollbar bg-[#141418] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[250] p-1.5 animate-slide-up space-y-0.5">
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-white/10 mb-1">
                    Seleccionar Año
                  </div>
                  {YEAR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedYear(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                        selectedYear === option.value
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 font-black'
                          : 'text-gray-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      {selectedYear === option.value && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Filtro por Popularidad / Orden */}
            <div className="relative shrink-0 overflow-visible">
              <button
                onClick={() => toggleDropdown('popularity')}
                className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all border shrink-0 ${
                  selectedPopularity !== 'default'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate max-w-[90px] sm:max-w-[130px] md:max-w-[160px]">{getPopularityLabel()}</span>
                <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${openDropdown === 'popularity' ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Popover */}
              {openDropdown === 'popularity' && (
                <div className="hidden md:block absolute top-full left-0 md:left-auto md:right-0 mt-2 w-64 max-h-80 overflow-y-auto custom-scrollbar bg-[#141418] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[250] p-1.5 animate-slide-up space-y-0.5">
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-white/10 mb-1">
                    Ordenar Contenido
                  </div>
                  {POPULARITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedPopularity(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                        selectedPopularity === option.value
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 font-black'
                          : 'text-gray-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{option.label}</span>
                      {selectedPopularity === option.value && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Reset / Limpiar filtros */}
            {isFiltered && (
              <button
                onClick={onResetFilters}
                title="Restablecer todos los filtros"
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/30 text-[11px] font-black uppercase tracking-wider transition-all shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>

          {/* Right Side: Total Results */}
          {typeof totalResults === 'number' && (
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-full shrink-0 ml-auto">
              <span className="text-white font-bold">{totalResults}</span> <span className="hidden sm:inline">{totalResults === 1 ? 'resultado' : 'resultados'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest shrink-0 mr-0.5 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-rose-500" />
          Rápido:
        </span>

        {/* Quick Popular */}
        <button
          onClick={() => setSelectedPopularity(selectedPopularity === 'popular' ? 'default' : 'popular')}
          className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
            selectedPopularity === 'popular'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
          }`}
        >
          🔥 Populares
        </button>

        {/* Quick Rating */}
        <button
          onClick={() => setSelectedPopularity(selectedPopularity === 'rating' ? 'default' : 'rating')}
          className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
            selectedPopularity === 'rating'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
          }`}
        >
          ⭐ Mejor Valorados
        </button>

        {/* Quick Years */}
        {['2025', '2024', '2023'].map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(selectedYear === year ? 'all' : year)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              selectedYear === year
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
            }`}
          >
            {year}
          </button>
        ))}

        {/* Quick Genres */}
        {['Acción', 'Comedia', 'Terror', 'Ciencia Ficción', 'Animación'].map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              selectedGenre === genre
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Render Mobile Bottom Sheet Modal */}
      {renderMobileModal()}
    </div>
  );
}
