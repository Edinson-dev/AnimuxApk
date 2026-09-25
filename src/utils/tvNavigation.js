/**
 * Animux Smart TV Spatial Navigation & Remote Control Engine (D-Pad)
 * Soporta: Android TV, Google TV, Samsung Tizen, LG webOS, Fire TV, Apple TV
 */

export function isSmartTV() {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('smart-tv') ||
    ua.includes('smarttv') ||
    ua.includes('googletv') ||
    ua.includes('android tv') ||
    ua.includes('tizen') ||
    ua.includes('webos') ||
    ua.includes('hbbtv') ||
    ua.includes('appletv') ||
    ua.includes('crkey') ||
    ua.includes('aft') // Amazon Fire TV
  );
}

/**
 * Inicializa el motor de navegación espacial con control remoto (D-Pad)
 */
export function initTvNavigation(options = {}) {
  if (typeof window === 'undefined') return () => {};

  let isTvMode = isSmartTV();

  if (isTvMode) {
    document.documentElement.classList.add('tv-mode');
  }

  const handleKeyDown = (e) => {
    // Si el usuario está escribiendo en un input, dejar comportamiento nativo
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    const key = e.key;

    // Detectar si el usuario usa flechas del control remoto para activar modo TV visual
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (!isTvMode) {
        isTvMode = true;
        document.documentElement.classList.add('tv-mode');
      }
    }

    // Manejar tecla Atrás/Volver/Escape
    if (key === 'Escape' || key === 'Backspace' || key === 'GoBack') {
      if (options.onBack && options.onBack()) {
        e.preventDefault();
        return;
      }
    }

    // Navegación Direccional (Spatial D-Pad)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const focusables = Array.from(
        document.querySelectorAll(
          'button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]:not([disabled]), a[href], input:not([disabled])'
        )
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });

      if (focusables.length === 0) return;

      const active = document.activeElement;
      if (!active || !focusables.includes(active)) {
        focusables[0]?.focus();
        e.preventDefault();
        return;
      }

      const activeRect = active.getBoundingClientRect();
      let bestCandidate = null;
      let bestDistance = Infinity;

      focusables.forEach(target => {
        if (target === active) return;
        const targetRect = target.getBoundingClientRect();

        let isCorrectDirection = false;
        let dx = 0;
        let dy = 0;

        const activeCenterX = activeRect.left + activeRect.width / 2;
        const activeCenterY = activeRect.top + activeRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        if (key === 'ArrowRight' && targetRect.left >= activeRect.left + 5) {
          isCorrectDirection = true;
          dx = targetCenterX - activeCenterX;
          dy = Math.abs(targetCenterY - activeCenterY) * 2; // Penalizar desalineación vertical
        } else if (key === 'ArrowLeft' && targetRect.right <= activeRect.right - 5) {
          isCorrectDirection = true;
          dx = activeCenterX - targetCenterX;
          dy = Math.abs(targetCenterY - activeCenterY) * 2;
        } else if (key === 'ArrowDown' && targetRect.top >= activeRect.top + 5) {
          isCorrectDirection = true;
          dy = targetCenterY - activeCenterY;
          dx = Math.abs(targetCenterX - activeCenterX) * 1.5;
        } else if (key === 'ArrowUp' && targetRect.bottom <= activeRect.bottom - 5) {
          isCorrectDirection = true;
          dy = activeCenterY - targetCenterY;
          dx = Math.abs(targetCenterX - activeCenterX) * 1.5;
        }

        if (isCorrectDirection) {
          const dist = Math.hypot(dx, dy);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestCandidate = target;
          }
        }
      });

      if (bestCandidate) {
        e.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
