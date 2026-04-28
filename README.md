# 🚀 Animux (StreamTV) - Documentación del Proyecto

Bienvenido a la documentación de la estructura del código de Animux. 
Esta guía rápida te permitirá saber a qué archivo exacto debes ir si deseas modificar funciones, estilos o lógicas de negocio en el futuro.

## 📂 Arquitectura Principal (Core)

*   `src/App.jsx` **(El Cerebro de la App)**
    *   **¿Qué hace?** Es el punto de entrada principal. Maneja toda la memoria de la aplicación, el "Splash Screen" (pantalla de carga), controla el caché de los navegadores (localStorage), y decide qué lista de categorías mostrar (`baseCats`).
    *   **Edítalo si:** Quieres agregar una categoría maestra nueva, cambiar la lógica de carga inicial, o modificar qué pantalla se muestra cuando alguien busca un canal.

*   `api/proxy.js` **(El Rompe-Bloqueos)**
    *   **¿Qué hace?** Es una función Serverless de Vercel. Recibe un canal de Xtream Codes, se disfraza de reproductor "VLC" y reescribe internamente todos los fragmentos `.ts` y `.key` de un `.m3u8`. Su objetivo es evadir errores CORS y "GEO-BLOCKED".
    *   **Edítalo si:** Cambia el sistema de seguridad de los proveedores IPTV, si Vercel cambia políticas de streaming, o si quieres añadir cabeceras (headers) más agresivas.

*   `src/components/core/Player.jsx` **(El Reproductor HLS)**
    *   **¿Qué hace?** Es el corazón visual del streaming. Usa la librería `Hls.js` para los videos en vivo. Tiene la lógica del "Fallback" (si el servidor actual se cae o da error, intenta cargar el siguiente canal de la lista).
    *   **Edítalo si:** Quieres mejorar el buffer, añadir un nuevo reproductor (ej. Video.js), o personalizar qué pasa si un canal da error de red.

*   `src/components/core/AdminPanel.jsx` **(Panel de Control Oculto)**
    *   **¿Qué hace?** Se activa al tocar 5 veces el logo de "Animux". Permite Añadir/Editar/Eliminar canales y guardarlos en Firebase.
    *   **Edítalo si:** Quieres añadir campos nuevos a los canales (como "Idioma" o "País") o si quieres modificar las categorías que aparecen en el dropdown.

*   `src/config/servers.js` **(El Motor Xtream Codes)**
    *   **¿Qué hace?** Contiene los arrays de todos tus servidores IPTV privados/públicos. Arma las URLs de usuario/contraseña, y desencripta las URL camufladas.
    *   **Edítalo si:** Tienes que añadir nuevos servidores Xtream de respaldo o modificar la forma en la que se generan los streams.

## 📱 Diseño y Navegación (Layout)

*   `src/components/layout/BottomNav.jsx` **(Barra Inferior Móvil)**
    *   **¿Qué hace?** Dibuja los 5 iconos flotantes en la parte inferior de los teléfonos celulares (Inicio, Música, Deportes, Favoritos, Buscar).
    *   **Edítalo si:** Quieres cambiar un ícono inferior o poner un atajo nuevo.

*   `src/components/layout/Header.jsx` **(Barra Superior)**
    *   **¿Qué hace?** Contiene la barra de búsqueda universal y el logo (que a su vez cuenta los clics para lanzar el panel de Admin).

*   `src/components/layout/Sidebar.jsx` & `CategoryBar.jsx`
    *   **¿Qué hacen?** El Sidebar es la barra izquierda que se ve en PCs y Tablets. El CategoryBar es la fila de botones deslizables horizontales debajo del buscador en móviles.

## 💾 Bases de Datos (Data)

*   `public/channels.json` & `public/m3u_channels.json` & `public/movies.json`
    *   **¿Qué hacen?** Son tus listas en frío. Si Firebase (la base de la nube) excede su límite diario gratuito, Animux carga todos los miles de canales directamente de aquí para no dejar sin TV a tus usuarios.
    *   **Edítalo si:** Quieres insertar listas masivas de cientos de canales con herramientas automatizadas.

*   `src/config/firebase.js`
    *   **¿Qué hace?** Tiene las llaves maestras para conectarte a Google Firebase Cloud Firestore (donde se guardan los canales que editas desde el panel Admin).

---
*Desarrollado en React + Vite + TailwindCSS. Listo para escalar a Progressive Web App (PWA).*
