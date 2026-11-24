/**
 * ═══════════════════════════════════════════════════════════════════
 * Animux - Configuración de Avisos de Actualización de la Plataforma
 * ═══════════════════════════════════════════════════════════════════
 * Este archivo gestiona el comportamiento del Pop-up que avisa
 * a los usuarios cada vez que compilas o se aplica una actualización.
 * ═══════════════════════════════════════════════════════════════════
 */

export const UPDATE_NOTICE_CONFIG = {
  // Activa o desactiva completamente el sistema de avisos
  enabled: true,

  // Si está en true, fuerza la aparición del Pop-up (útil para pruebas o mantenimientos)
  forceNotice: false,

  // Avisar a los usuarios activos cuando detectan que se compiló/desplegó una nueva versión
  notifyOnLiveDeploy: true,

  // Avisar al abrir la app tras una compilación reciente
  notifyOnFirstOpen: true,

  // Intervalo de comprobación en vivo en segundos (comprueba si hay nueva compilación)
  checkIntervalSeconds: 30,

  // Títulos y textos por defecto
  title: '¡Actualización de la Plataforma!',
  statusBadge: 'EN ESTOS MOMENTOS',
  liveMessage: 'En estos momentos se está realizando una actualización en la plataforma. se deshabilitaron los anuncios ADS para mejor rendimiento.',
  welcomeMessage: '¡La plataforma ha sido actualizada con éxito! Disfruta de la mejor calidad, mayor fluidez y contenido renovado.',

  // Puntos clave de la actualización que se muestran en el Pop-up
  highlights: [
    { icon: 'Zap', text: 'Servidores y velocidad de streaming optimizados' },
    { icon: 'Film', text: 'Nuevos canales, películas y series agregados' },
    { icon: 'ShieldCheck', text: 'Mayor estabilidad y corrección de reproducción' }
  ]
};
