import React, { useEffect, useRef } from 'react';
import { Search, Tv, User, Bell } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <header className="h-auto md:h-24 bg-transparent flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-4 md:py-0 z-50 sticky top-0 w-full">
      {/* Premium Glass Effect Behind Header purely for scroll */}
      <div className="absolute inset-0 bg-[#030305]/70 backdrop-blur-3xl border-b border-white/[0.03] -z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"></div>
      
      {/* Brand logo */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/10 group-hover:border-indigo-500/50 transition-all duration-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]">
            <Tv size={26} className="text-white group-hover:text-indigo-300 transition-colors duration-300" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse -translate-y-1/3 translate-x-1/3"></div>
          </div>
          <span className="text-3xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-400 transition-all duration-300">
            Animux
          </span>
        </div>
      </div>
      
      {/* Search Bar - Center */}
      <div className="relative w-full md:flex-1 md:max-w-2xl mt-4 md:mt-0 group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors duration-300" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar anime, canal, género..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] group-focus-within:bg-[#08080C] group-focus-within:border-indigo-500/50 group-focus-within:shadow-[0_0_30px_rgba(79,70,229,0.15)] rounded-full py-4 pl-14 pr-16 text-white placeholder-gray-500 font-medium outline-none transition-all duration-500"
        />
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
          <div className="hidden sm:flex items-center gap-1 font-bold text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
            <span>CTRL</span>
            <span>K</span>
          </div>
        </div>
      </div>
      
      {/* Profile & Notifications - Right */}
      <div className="hidden md:flex items-center gap-6">
        <button className="relative p-3 rounded-full hover:bg-white/5 transition-colors group">
          <Bell className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"></span>
        </button>
        <button className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-[2px]">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-[#050508]" />
          </div>
          <span className="font-semibold text-sm text-gray-200">Usuario</span>
        </button>
      </div> 
    </header>
  );
}
