import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ADS_CONFIG, ADSTERRA_CONFIG } from '../../config/ads';

export default function AdsterraNativeBanner({ className = '' }) {
  const containerRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!ADS_CONFIG.enabled || !ADS_CONFIG.adsterraEnabled || dismissed) return;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';

    const adDiv = document.createElement('div');
    adDiv.id = ADSTERRA_CONFIG.containerId;
    currentContainer.appendChild(adDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = ADSTERRA_CONFIG.scriptSrc;

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [dismissed]);

  if (!ADS_CONFIG.enabled || !ADS_CONFIG.adsterraEnabled || dismissed) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d10] p-2 sm:p-3 my-2 transition-all duration-300 ${className}`}
    >
      {/* Header con botón de cerrar */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.25em]">
            Patrocinado
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          title="Cerrar anuncio"
          className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1 text-[9px]"
        >
          <span className="text-[8px] font-bold">Cerrar</span>
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Contenedor del anuncio */}
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center min-h-[60px] max-h-[160px] overflow-hidden rounded-xl"
      />
    </div>
  );
}
