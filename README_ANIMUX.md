# Documentación de Animux StreamTV 🍿

Esta aplicación ha sido transformada en una plataforma de streaming premium inspirada en el diseño cinematográfico de Cuevana 3. A continuación se detalla para qué sirve cada archivo y los cambios realizados hoy.

## 📂 Estructura de Archivos
### Backend (Servicios de Contenido)
*   `backend/services/updater.js`: El motor principal. Se encarga de descargar listas IPTV, filtrar canales caídos o restringidos y unificar todo en un solo catálogo (`channels.json`).
*   `backend/services/vod.js`: Controla las Series y Películas. Hoy se optimizó para extraer contenido de **Archive.org** (Simpsons, Dragon Ball Z, Malcolm) con limpieza de nombres y codificación de URLs.
*   `backend/services/xtream.js`: Cliente para conectar con servidores Xtream para contenido premium.
*   `backend/data/channels.json`: El archivo final que lee la aplicación con todos los canales y series.

### Frontend (Interfaz de Usuario)
*   `src/App.jsx`: El cerebro de la interfaz. Maneja el buscador inteligente, el agrupamiento de capítulos (para que las series no desordenen el grid) y el menú de navegación superior.
*   `src/components/Player.jsx`: Reproductor avanzado con sistema de "Falla y Recuperación". Si un video no carga, ofrece abrirlo en una pestaña externa.
*   `src/components/ChannelCard.jsx`: El diseño de las tarjetas (posters). Ahora incluye badges de calidad (HD) y efectos de hover premium.
*   `src/components/Header.jsx`: Menú superior minimalista con barra de búsqueda y navegación por géneros.

## 🚀 Cambios Realizados Hoy
1.  **Rediseño Visual**: Implementación de un fondo oscuro profundo, tipografía Inter y un grid denso de 10 columnas (estilo Cuevana).
2.  **Buscador Inteligente**: Arreglado para que no distinga entre mayúsculas y minúsculas y encuentre series clásicas fácilmente.
3.  **Corrección de Reproducción**: Implementación de `encodeURIComponent` para que los videos con espacios en el nombre funcionen perfectamente en el navegador.
4.  **Restauración de Series**: Inyección de colecciones completas en Latino (Dragon Ball Z, Los Simpsons, Malcolm) con sistema de episodios a la derecha en el reproductor.

## 📱 Uso en el Celular
La app es 100% responsiva. Si una película da "Error de Emisión", usa el botón **"Abrir en Fuente Externa"** para reproducirla con la app de **VLC** en tu móvil.

---
*Desarrollado para Animux Live - 2026*
