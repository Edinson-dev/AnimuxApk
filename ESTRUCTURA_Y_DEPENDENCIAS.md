# Documentación Técnica: Animux (StreamTV)

Este documento detalla la arquitectura, dependencias y el propósito de cada carpeta y archivo dentro del proyecto **Animux**.

---

## 🚀 Tecnologías y Dependencias

### Lenguajes y Core
- **JavaScript (ES6+)**: Lenguaje principal para frontend y backend.
- **HTML5 & CSS3**: Estructura y estilos base.
- **Node.js**: Entorno de ejecución para el servidor backend y scripts de automatización.

### Frontend (React + Vite)
- **React 19**: Framework para la interfaz de usuario.
- **Vite**: Herramienta de construcción y servidor de desarrollo.
- **Tailwind CSS**: Framework de utilidades CSS para el diseño.
- **HLS.js**: Soporte para reproducción de video en formato streaming (HLS).
- **Lucide React**: Biblioteca de iconos.
- **Firebase**: Integración para base de datos o autenticación.
- **Vite PWA Plugin**: Convierte la web en una Aplicación Web Progresiva (PWA) instalable.

### Backend (Express)
- **Express**: Framework para la API y el servidor.
- **Axios**: Cliente HTTP para obtener datos externos.
- **Node-cron**: Programación de tareas (ej. actualización automática de listas).
- **CORS**: Gestión de permisos de acceso entre frontend y backend.

---

## 📂 Estructura de Carpetas y Archivos

### Raíz del Proyecto
| Archivo / Carpeta | Descripción |
| :--- | :--- |
| `src/` | Contiene todo el código fuente del frontend (React). |
| `backend/` | Servidor Node.js que gestiona datos y tareas automáticas. |
| `api/` | Funciones de API (probablemente proxies para evitar bloqueos de CORS). |
| `functions/` | Código para funciones serverless (Cloudflare/Vercel). |
| `public/` | Archivos estáticos como el favicon, iconos de la PWA y manifiesto. |
| `dist/` | Carpeta generada tras el comando de `build` con el código listo para producción. |
| `index.html` | Punto de entrada principal de la aplicación web. |
| `package.json` | Lista de dependencias y scripts de ejecución (start, build, dev). |
| `vite.config.js` | Configuración del empaquetador Vite y sus plugins (como PWA). |
| `tailwind.config.js` | Personalización de colores, fuentes y estilos de Tailwind. |
| `wrangler.toml` | Configuración para despliegue en Cloudflare Pages/Workers. |

---

### 📂 Carpeta `src/` (Frontend)
- **`main.jsx`**: Punto de inicio de React que renderiza la aplicación.
- **`App.jsx`**: Componente principal que contiene la lógica de navegación y estructura general.
- **`App.css` / `index.css`**: Estilos globales y configuraciones de Tailwind.
- **`components/`**: Pequeñas piezas reutilizables de la interfaz (Botones, Reproductores, Tarjetas).
- **`assets/`**: Imágenes, logos y recursos visuales.
- **`config/`**: Archivos de configuración (ej. llaves de Firebase).
- **`utils/`**: Funciones auxiliares y herramientas de ayuda.
- **`data/`**: Datos locales o JSONs estáticos.

---

### 📂 Carpeta `backend/` (Servidor)
- **`server.js`**: El archivo principal que levanta el servidor Express.
- **`services/`**: Lógica para obtener contenido de fuentes externas (scrapers o APIs).
- **`data/`**: Almacenamiento local de los JSONs con las listas de películas y anime.
- **`package.json`**: Dependencias específicas para el backend.

---

### 🛠️ Scripts de Automatización (`.cjs`)
Estos archivos son herramientas que se ejecutan de forma independiente para mantener el contenido actualizado:
- **`fetch-anime.cjs` / `fetch-spanish.cjs`**: Scripts para buscar y extraer información de nuevas series o películas.
- **`append-anime.cjs`**: Añade el contenido nuevo a las listas existentes.
- **`build-ultimate-list.cjs`**: Compila toda la información en un solo archivo maestro para que la app lo lea rápidamente.

---

## 📱 Funcionamiento como "APK"
Aunque el proyecto está en una carpeta llamada `AnimuxApk`, no es una aplicación nativa de Android (Java/Kotlin). Funciona como una **PWA (Progressive Web App)**. 
- Al abrirla en el navegador del móvil, permite "Añadir a la pantalla de inicio".
- Se instala con un icono propio y funciona a pantalla completa, eliminando la barra del navegador, lo que da la experiencia de una App real.
