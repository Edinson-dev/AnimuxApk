import React, { useEffect } from 'react';
import { ADS_CONFIG, ADSTERRA_CONFIG } from '../../config/ads';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AdsterraSocialBar — Notificación flotante pequeña y cerrable (X)
 * ═══════════════════════════════════════════════════════════════════
 * Se inyecta de forma flotante en una esquina de la pantalla sin
 * romper el diseño, empujar el contenido ni saturar al usuario.
 * ═══════════════════════════════════════════════════════════════════
 */
export default function AdsterraSocialBar() {
  useEffect(() => {
    if (!ADS_CONFIG.enabled || !ADS_CONFIG.socialBarEnabled) return;

    const SCRIPT_ID = 'adsterra-social-bar-script';
    
    // Evitar inyectar múltiples veces si ya existe
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = ADSTERRA_CONFIG.socialBarScript;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [ADS_CONFIG.enabled, ADS_CONFIG.socialBarEnabled]);

  return null;
}
