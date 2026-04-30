# Animux Streaming Platform 🚀

Manual técnico y guía de estructura para el mantenimiento de la plataforma.

## 📡 Arquitectura de Proxy & Relay
La plataforma utiliza un sistema de dos niveles para garantizar la reproducción:
1.  **Cloudflare Pages Function (`/functions/api/proxy.js`)**: Procesa todas las peticiones, inyecta headers CORS y decide si un canal es seguro o si está bloqueado por IP.
2.  **Render Relay (Externo)**: Actúa como un puente (bridge) para las IPs colombianas (`181.78.x.x`) que bloquean a Cloudflare. **No requiere mantenimiento constante.**

---

## 📂 Guía de Carpetas y Archivos

### 🎨 Frontend (`/src`)
- **`/components/core/Player.jsx`**: El reproductor principal. Aquí se gestiona la lógica de qué canal necesita proxy.
- **`/components/layout`**: Sidebar y estructura general de la página.
- **`/hooks`**: Funciones que se conectan a Firebase para traer canales y categorías.

## 🛠️ Mapa de Edición (¿Qué cambiar y dónde?)

Si quieres modificar algo visual, busca el archivo correspondiente aquí:

### Navegación y Menús (`src/components/layout`)
- **`Sidebar.jsx`**: Edita el menú lateral de PC (Categorías, Logos).
- **`BottomNav.jsx`**: Edita la barra de botones inferior para Celulares.
- **`Navbar.jsx`**: Edita la barra superior (Buscador y Logo principal).
- **`Hero.jsx`**: Edita el banner animado superior (el destacado estilo Apple TV).

### Reproducción y Canales (`src/components/core`)
- **`Player.jsx`**: El motor del video. Edita controles, tiempos de carga y lógica de proxy.
- **`ChannelCard.jsx`**: Diseño de las tarjetas de canales (Efectos hover, tamaños).
- **`CategorySection.jsx`**: Cómo se agrupan los canales por categorías en el inicio.

### Ventanas y Diálogos (`src/components/modals`)
- **`SettingsModal.jsx`**: Contenido de la ventana de ajustes/configuración.

### 🧠 Backend (`/functions`)
- **`/api/proxy.js`**: Gestiona el bypass de seguridad de los proveedores IPTV. Es el archivo que "engaña" al servidor para que crea que somos un reproductor VLC.

### 🛠️ Scripts de Datos (Raíz)
- **`fetch-*.cjs`**: Scripts para scrapear y actualizar canales.
- **`build-ultimate-list.cjs`**: Script para consolidar bases de datos de canales.

### ⚙️ Configuración
- **`wrangler.toml`**: Configuración de Cloudflare Pages.
- **`vite.config.js`**: Reglas de compilación y optimización PWA.
- **`package.json`**: Listado de dependencias del proyecto.

---

## 🚀 Flujo de Trabajo (Mantenimiento)

### 1. ¿Cómo actualizar la web?
Simplemente realiza tus cambios en `src` y ejecuta:
```bash
npm run build
git add -A
git commit -m "Descripción del cambio"
git push
```
Cloudflare actualizará la web automáticamente en 1 minuto.

### 2. ¿Cómo agregar un canal bloqueado?
Si agregas un canal que no carga, verifica su IP. Si empieza por algo nuevo (ej: `190.x.x.x`), agrégalo a la lista `BLOCKED_IPS` en `functions/api/proxy.js`.

---
Mantenido por Edinson-dev.
