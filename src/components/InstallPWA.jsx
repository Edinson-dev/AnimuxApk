import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

/**
 * InstallPWA — Handles PWA install for all platforms:
 * - Android / Chrome / Samsung: uses beforeinstallprompt event
 * - iOS / Safari: shows manual "Add to Home Screen" instructions
 * - Desktop Chrome/Edge: uses beforeinstallprompt event
 * - Firefox / others: not supported (component hides)
 */
export default function InstallPWA({ onInstall, showInstall, variant = 'banner' }) {
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showPCGuide, setShowPCGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detect iOS (iPhone, iPad, iPod)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Already installed as PWA?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Detect Desktop
    const desktop = !/android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsDesktop(desktop);

    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('animux_pwa_dismissed');
    if (wasDismissed) {
      const since = Date.now() - parseInt(wasDismissed, 10);
      // Re-show after 7 days
      if (since < 7 * 24 * 60 * 60 * 1000) setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSGuide(false);
    localStorage.setItem('animux_pwa_dismissed', Date.now().toString());
  };

  // Don't show if: already standalone or (banner is dismissed)
  if (isStandalone) return null;
  if (dismissed && variant === 'banner') return null;

  // ── iOS Banner ───────────────────────────────────────────────────────────
  if (isIOS) {
    if (variant === 'header') {
      return (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 border border-rose-600/30 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar
        </button>
      );
    }

    return (
      <>
        {/* iOS floating banner */}
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 z-[90] animate-slide-up">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <img src="/icon-192.png" alt="Animux" className="w-10 h-10 rounded-xl shrink-0 border border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm truncate">Instalar Animux</p>
              <p className="text-gray-500 text-[10px] font-medium">Toca <Share className="inline w-3 h-3" /> y luego "Añadir a inicio"</p>
            </div>
            <button onClick={() => setShowIOSGuide(true)} className="px-3 py-1.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase shrink-0">
              ¿Cómo?
            </button>
            <button onClick={handleDismiss} className="p-1 text-gray-600 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS Step-by-step guide modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black text-lg">Instalar en iPhone</h3>
                <button onClick={() => setShowIOSGuide(false)} className="p-2 bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { step: '1', icon: '🌐', text: 'Abre esta página en Safari (no en Chrome ni otro navegador)' },
                  { step: '2', icon: '⬆️', text: 'Toca el ícono de compartir en la barra inferior de Safari' },
                  { step: '3', icon: '➕', text: 'Desplázate y selecciona "Añadir a pantalla de inicio"' },
                  { step: '4', icon: '✅', text: 'Confirma tocando "Añadir" en la esquina superior derecha' },
                ].map(({ step, icon, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-rose-600/20 border border-rose-600/30 rounded-full flex items-center justify-center text-rose-400 text-xs font-black shrink-0 mt-0.5">
                      {step}
                    </div>
                    <div>
                      <span className="text-lg mr-1">{icon}</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Android / Chrome / Desktop header button (PERSISTENT) ───────────────
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={showInstall ? onInstall : () => setShowPCGuide(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 border border-rose-600/30 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar
        </button>

        {/* PC Step-by-step guide modal */}
        {showPCGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black text-lg uppercase tracking-tighter">Instalar en PC</h3>
                <button onClick={() => setShowPCGuide(false)} className="p-2 bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-rose-600/20 border border-rose-600/30 rounded-full flex items-center justify-center text-rose-400 text-xs font-black shrink-0">1</div>
                  <p className="text-gray-300 text-sm leading-relaxed">Mira la <b>barra de direcciones</b> arriba a la derecha.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-rose-600/20 border border-rose-600/30 rounded-full flex items-center justify-center text-rose-400 text-xs font-black shrink-0">2</div>
                  <p className="text-gray-300 text-sm leading-relaxed">Haz clic en el ícono de <b>Instalar Animux</b> (un monitor con una flecha <Download className="inline w-3 h-3" />).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-rose-600/20 border border-rose-600/30 rounded-full flex items-center justify-center text-rose-400 text-xs font-black shrink-0">3</div>
                  <p className="text-gray-300 text-sm leading-relaxed">Dale a <b>"Instalar"</b> y listo. Se creará un acceso directo en tu escritorio.</p>
                </div>
              </div>

              <button
                onClick={() => setShowPCGuide(false)}
                className="w-full py-3 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Android / Chrome / Desktop banner ───────────────────────────────────
  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 z-[90] animate-slide-up">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <img src="/icon-192.png" alt="Animux" className="w-10 h-10 rounded-xl shrink-0 border border-white/10" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm truncate">
            {isDesktop ? 'Instalar Animux en PC' : 'Instalar Animux'}
          </p>
          <p className="text-gray-500 text-[10px] font-medium">
            {isDesktop ? 'Experiencia rápida · Acceso directo' : 'Accede sin internet · Experiencia nativa'}
          </p>
        </div>
        <button
          onClick={() => { onInstall(); handleDismiss(); }}
          className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase shrink-0"
        >
          Instalar
        </button>
        <button onClick={handleDismiss} className="p-1 text-gray-600 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
