import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Heart, Info } from 'lucide-react';

// Singleton — se puede llamar desde cualquier archivo
let _add = null;

export const toast = {
  success: (msg) => _add?.(msg, 'success'),
  error:   (msg) => _add?.(msg, 'error'),
  info:    (msg) => _add?.(msg, 'info'),
  fav:     (msg) => _add?.(msg, 'fav'),
};

const CONFIG = {
  success: { Icon: CheckCircle, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  error:   { Icon: AlertCircle, cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  info:    { Icon: Info,         cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  fav:     { Icon: Heart,        cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _add = (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    return () => { _add = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(({ id, message, type }) => {
        const { Icon, cls } = CONFIG[type] || CONFIG.success;
        return (
          <div key={id} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl animate-fade-in ${cls}`}>
            <Icon className="w-4 h-4 shrink-0" fill={type === 'fav' ? 'currentColor' : 'none'} />
            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{message}</span>
          </div>
        );
      })}
    </div>
  );
}
