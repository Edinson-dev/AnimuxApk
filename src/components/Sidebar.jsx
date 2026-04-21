import React from 'react';
import { Film, Heart, List, PlaySquare, Swords, Tv } from 'lucide-react';

// Una función de ayuda para asignar un ícono dependiendo del nombre de la categoría
const getCategoryIcon = (categoryName) => {
  const nameL = categoryName.toLowerCase();
  if (nameL === 'todos') return List;
  if (nameL === 'favoritos') return Heart;
  if (nameL.includes('shonen') || nameL.includes('acción') || nameL.includes('pelea')) return Swords;
  if (nameL.includes('cine')) return Film;
  if (nameL.includes('isekai') || nameL.includes('aventura')) return PlaySquare;
  return Tv; // Ícono por defecto
};

export default function Sidebar({ categories, activeCategory, setActiveCategory }) {
  // categories es ahora un arreglo de strings y generamos los items dinámicamente.
  return (
    <aside className="w-20 lg:w-64 bg-background/50 backdrop-blur-2xl border-r border-white/5 h-full flex flex-col py-6 transition-all duration-300 z-30">
      <nav className="flex-1 flex flex-col gap-3 px-4 overflow-y-auto custom-scrollbar">
        {categories.map((cat) => {
          const catName = typeof cat === 'string' ? cat : cat.name;
          const catCount = cat.count;
          const Icon = catName === 'Todos' ? List : catName === 'Favoritos' ? Heart : getCategoryIcon(catName);
          const isActive = activeCategory === catName;
          
          return (
            <button
              key={catName}
              onClick={() => setActiveCategory(catName)}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              )}
              <Icon className={`w-6 h-6 shrink-0 transition-all duration-300 ${isActive ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'group-hover:scale-110 group-hover:text-gray-200'}`} 
                    fill={catName === 'Favoritos' && isActive ? "currentColor" : "none"} />
              <div className="hidden lg:flex flex-1 items-center justify-between text-left truncate">
                <span className={`font-medium truncate tracking-wide ${isActive ? 'font-bold' : ''}`}>{catName}</span>
                {catCount !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${isActive ? 'bg-primary/30 text-primary' : 'bg-white/10 text-gray-400'}`}>
                    {catCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
