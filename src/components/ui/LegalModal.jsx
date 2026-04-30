import React, { useState } from 'react';
import { X, Shield, Scale, Info, ExternalLink, Mail } from 'lucide-react';

export default function LegalModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('legal');

  const tabs = [
    { id: 'legal', label: 'Aviso Legal', icon: Scale },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'dmca', label: 'DMCA / Copyright', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-rose-900/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/20 rounded-xl">
              <Scale className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Centro Legal</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Información y Términos de Uso</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-2 bg-white/[0.02]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-rose-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 text-sm leading-relaxed text-gray-300 font-medium">
          
          {activeTab === 'legal' && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-white font-black uppercase tracking-widest text-xs">1. Naturaleza del Servicio</h3>
              <p>
                Animux es una plataforma tecnológica que funciona estrictamente como un **reproductor de contenido multimedia**. Nuestra aplicación facilita la interfaz visual para acceder a transmisiones de video que ya están disponibles públicamente en Internet.
              </p>
              <h3 className="text-white font-black uppercase tracking-widest text-xs">2. Exención de Responsabilidad</h3>
              <p>
                Animux **NO aloja, almacena ni distribuye** ningún archivo de video, película o canal en sus propios servidores. Todo el contenido visualizado a través de esta aplicación es propiedad de y es transmitido por proveedores de servicios externos y plataformas de terceros.
              </p>
              <p>
                Al utilizar esta aplicación, el usuario reconoce que Animux no tiene control sobre la disponibilidad, legalidad o calidad de los enlaces externos utilizados.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-white font-black uppercase tracking-widest text-xs">Compromiso de Privacidad</h3>
              <p>
                En Animux valoramos su anonimato. Nuestra política es simple: **No recolectamos ningún dato personal**.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li>No requerimos registro ni correos electrónicos.</li>
                <li>No rastreamos su ubicación ni historial de navegación.</li>
                <li>Los "Favoritos" y "Recientes" se almacenan localmente en su dispositivo mediante LocalStorage.</li>
              </ul>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-blue-400 text-[11px] font-bold">
                  Sus preferencias nunca salen de su navegador/dispositivo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dmca' && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-white font-black uppercase tracking-widest text-xs">Aviso DMCA / Copyright</h3>
              <p>
                Respetamos los derechos de propiedad intelectual de terceros. Animux es una herramienta de software (cliente) que permite la reproducción de flujos de red.
              </p>
              <p>
                Si usted es propietario de derechos de autor y cree que algún contenido accesible a través de los enlaces que se muestran en esta app infringe sus derechos, le recomendamos encarecidamente que **se comunique con el proveedor de alojamiento del contenido original**, ya que Animux no tiene capacidad para eliminar contenido de servidores que no le pertenecen.
              </p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">Contacto para aclaraciones:</p>
                <a 
                  href="mailto:soporte@animux.app" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10"
                >
                  <Mail className="w-4 h-4 text-rose-500" />
                  soporte@animux.app
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Última actualización: Abril 2026
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
