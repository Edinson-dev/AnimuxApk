// Sistema de Internacionalización (i18n) Ultraligero y Reactivo para Animux
import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'España / LATAM' },
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'Global / USA' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'Brasil / Portugal' },
];

export const TRANSLATIONS = {
  es: {
    // Nav & Header
    home: 'Inicio',
    movies: 'Cine (VOD)',
    movies_short: 'Cine',
    series: 'Series (VOD)',
    series_short: 'Series',
    live_tv: 'TV Abierta',
    live_tv_short: 'En Vivo',
    favorites: 'Favoritos',
    search: 'Buscar',
    tv_guide: 'Ver en TV',
    kids_mode_on: 'Activar Modo Kids',
    kids_mode_off: 'Desactivar Modo Kids',
    refresh_data: 'Recargar datos',
    control_center: 'Centro de Control',
    accent_themes: 'Temas de Acento',
    language_selector: 'Seleccionar Idioma',
    terms_privacy: 'Términos y Privacidad',
    search_placeholder: 'Buscar canales, películas, series...',
    safe_badge: 'Seguro',
    new_version_available: '¡Nueva versión disponible!',
    new_version_desc: 'Hay mejoras de estabilidad y nuevos canales listos para instalar.',
    update_now: 'Actualizar Ahora',
    up_to_date: 'Versión al día',
    last_sync: 'Última sinc',
    telegram_group: 'Canal Oficial de Telegram',
    telegram_desc: 'Pide películas, series o reporta caídas directamente.',
    join_telegram: 'Unirme al Grupo',
    reloading_data: 'Recarga canales y películas desde Firebase',
    
    // Moods & Search
    what_to_watch: '¿Qué te apetece ver hoy?',
    mood_movies: '🍿 Cine & Palomitas',
    mood_action: '⚡ Adrenalina & Acción',
    mood_sports: '⚽ Deportes en Vivo',
    mood_comedy: '😂 Risas & Comedia',
    mood_series: '📺 Maratón de Series',
    mood_docs: '🧠 Documentales',
    mood_kids: '👶 Espacio Niños',
    mood_music: '🎶 Música & Conciertos',
    searching_for: 'Buscando',
    searching_desc: 'Explora todos los canales y películas coincidentes',
    see_results: 'Ver Resultados',
    no_results: 'No se encontraron resultados para tu búsqueda.',
    active_filters: 'Activos',
    explore_catalog: 'Explorar Catálogo',
    results_count: 'Resultados',
    result_singular: 'resultado',
    results_plural: 'resultados',

    // Filters
    filters: 'Filtros',
    genre: 'Género',
    year: 'Año',
    popularity: 'Popularidad',
    sort_content: 'Ordenar Contenido',
    select_genre: 'Seleccionar Género',
    select_year: 'Seleccionar Año',
    all_genres: 'Todos los Géneros',
    all_years: 'Todos los Años',
    default_sort: 'Predeterminado',
    most_popular: 'Más Populares',
    highest_rated: 'Mejor Valorados',
    newest: 'Más Recientes',
    title_az: 'Título (A - Z)',
    quick_filters: 'Rápido',
    clean_filters: 'Limpiar',
    popular_badge: '🔥 Populares',
    rated_badge: '⭐ Mejor Valorados',

    // Hero
    exclusive_premiere: 'Estreno Exclusivo',
    trending: 'Tendencia',
    animux_original: 'Animux Original • Premium',
    play: 'Reproducir',
    info: 'Info',
    featured_title: 'Título Destacado',
    default_hero_desc: 'Disfruta de la mejor calidad de imagen y sonido envolvente. Solo aquí en la plataforma líder de streaming.',

    // Rows & Sections
    top_kids: 'Top Infantiles',
    anime_cartoons: 'Anime y Dibujos',
    disney_nick: 'Mundo Disney & Nick',
    movies_vod: 'Películas (VOD)',
    series_vod: 'Series (VOD)',
    live_sports: 'Deportes en Vivo',
    continue_watching: 'Continuar Viendo',
    explore_all: 'Explorar Todo',

    // Categories translation mapping
    cat_inicio: 'Inicio',
    cat_cine: 'Cine (VOD)',
    cat_series: 'Series (VOD)',
    cat_deportes: 'Deportes',
    cat_noticias: 'Noticias',
    cat_infantil: 'Infantil',
    cat_musica: 'Música',
    cat_documentales: 'Documentales',
    cat_entretenimiento: 'Entretenimiento',
    cat_religioso: 'Religioso',
    cat_general: 'General',
    cat_abierta: 'TV Abierta',
    cat_favoritos: 'Favoritos',

    // Modals & Extra
    later: 'Más Tarde',
    close: 'Cerrar',
    details: 'Detalles',
    synopsis: 'Sinopsis',
    cast_crew: 'Reparto',
    genres: 'Géneros',
    release_date: 'Fecha de Estreno',
    duration: 'Duración',
    rating: 'Calificación',
    server: 'Servidor',
    select_server: 'Seleccionar Servidor',
    back_to_app: 'Volver a la App',
    support_project: 'Apoyar el Proyecto',
    terms_and_conditions: 'Términos y Condiciones',
    privacy_policy: 'Privacidad',
    no_results_desc: 'No hay contenidos que coincidan con la combinación de filtros seleccionada.',
    watch_now: 'Reproducir Ahora',
    on_air_now: 'En emisión ahora',
    live_247: 'Programación en vivo 24/7',
    live_desc: 'Streaming premium de alta calidad sin interrupciones.',
    signal_status: 'Estado de Señal',
    excellent: 'Excelente',
    internal_id: 'ID Interno',
    more_like_this: 'Más como esto',
    report_issue: 'Reportar problema',
    shared_success: 'Contenido compartido',
    link_copied: 'Enlace copiado al portapapeles',
    cannot_share: 'No se pudo compartir',
    added_to_favs: 'Añadido a favoritos',
    removed_from_favs: 'Eliminado de favoritos',
    report_sent: 'Informe enviado. Revisaremos este canal pronto.',
    tv_guide_title: 'Lleva Animux a tu TV',
    tv_guide_subtitle: 'Sin Chromecast • Sin Cables',
    tv_step1_title: '1. Enciende tu Smart TV',
    tv_step1_desc: 'Busca la aplicación de Navegador Web o Internet en tu televisor (LG, Samsung, Android TV).',
    tv_step2_title: '2. Escribe la dirección',
    tv_step2_desc: 'En la barra de direcciones de arriba, escribe exactamente:',
    tv_step3_title: '3. Usa tu Control Remoto',
    tv_step3_desc: '¡No necesitas mouse! Usa las flechas de tu control para moverte por las películas y presiona OK / Select para reproducir.',
    tv_enjoy_btn: '¡Entendido, a disfrutar!',
    new_version_ready: '¡Nueva Versión Lista!',
    new_version_body: 'Se ha desplegado una nueva versión de Animux con mejoras de rendimiento, soporte de idiomas y temas dinámicos.',
    feature_themes: 'Nuevos temas de acento visual (Paleta 🎨)',
    feature_smart_tv: 'Soporte total para Smart TV & Chromecast / AirPlay',
    feature_optimized: 'Canales y transmisiones 100% optimizados',
    updating_btn: 'Actualizando...',

    // Share & Promo
    share_with_friends: 'Compartir con Amigos',
    share_title: '¡Mira lo que estoy viendo en Animux!',
    share_text: 'Te recomiendo Animux, el mejor reproductor de películas, series y TV en vivo sin publicidad molesta:',
    copied_to_clipboard: '¡Enlace copiado al portapapeles!',
  },

  en: {
    // Nav & Header
    home: 'Home',
    movies: 'Movies (VOD)',
    movies_short: 'Movies',
    series: 'Series (VOD)',
    series_short: 'Series',
    live_tv: 'Live TV',
    live_tv_short: 'Live TV',
    favorites: 'Favorites',
    search: 'Search',
    tv_guide: 'Watch on TV',
    kids_mode_on: 'Enable Kids Mode',
    kids_mode_off: 'Disable Kids Mode',
    refresh_data: 'Refresh data',
    control_center: 'Control Center',
    accent_themes: 'Accent Themes',
    language_selector: 'Select Language',
    terms_privacy: 'Terms & Privacy',
    search_placeholder: 'Search channels, movies, series...',
    safe_badge: 'Secure',
    new_version_available: 'New version available!',
    new_version_desc: 'Performance enhancements and new channels are ready to install.',
    update_now: 'Update Now',
    up_to_date: 'Up to date',
    last_sync: 'Last sync',
    telegram_group: 'Official Telegram Channel',
    telegram_desc: 'Request movies, series or report stream issues directly.',
    join_telegram: 'Join Group',
    reloading_data: 'Reloading channels and movies from Firebase',

    // Moods & Search
    what_to_watch: 'What do you feel like watching today?',
    mood_movies: '🍿 Movies & Popcorn',
    mood_action: '⚡ Action & Adrenaline',
    mood_sports: '⚽ Live Sports',
    mood_comedy: '😂 Comedy & Laughs',
    mood_series: '📺 Series Marathon',
    mood_docs: '🧠 Documentaries',
    mood_kids: '👶 Kids Corner',
    mood_music: '🎶 Music & Concerts',
    searching_for: 'Searching for',
    searching_desc: 'Explore all matching channels and movies',
    see_results: 'See Results',
    no_results: 'No matching results were found.',
    active_filters: 'Active',
    explore_catalog: 'Explore Catalog',
    results_count: 'Results',
    result_singular: 'result',
    results_plural: 'results',

    // Filters
    filters: 'Filters',
    genre: 'Genre',
    year: 'Year',
    popularity: 'Sort by',
    sort_content: 'Sort Content',
    select_genre: 'Select Genre',
    select_year: 'Select Year',
    all_genres: 'All Genres',
    all_years: 'All Years',
    default_sort: 'Default',
    most_popular: 'Most Popular',
    highest_rated: 'Highest Rated',
    newest: 'Latest Releases',
    title_az: 'Title (A - Z)',
    quick_filters: 'Quick',
    clean_filters: 'Clear',
    popular_badge: '🔥 Popular',
    rated_badge: '⭐ Top Rated',

    // Hero
    exclusive_premiere: 'Exclusive Premiere',
    trending: 'Trending',
    animux_original: 'Animux Original • Premium',
    play: 'Play Now',
    info: 'Info',
    featured_title: 'Featured Title',
    default_hero_desc: 'Enjoy crystal clear picture quality and immersive sound. Only here on the premier streaming hub.',

    // Rows & Sections
    top_kids: 'Top Kids Picks',
    anime_cartoons: 'Anime & Cartoons',
    disney_nick: 'Disney & Nick World',
    movies_vod: 'Movies (VOD)',
    series_vod: 'Series (VOD)',
    live_sports: 'Live Sports',
    continue_watching: 'Continue Watching',
    explore_all: 'Explore All',

    // Categories translation mapping
    cat_inicio: 'Home',
    cat_cine: 'Movies (VOD)',
    cat_series: 'Series (VOD)',
    cat_deportes: 'Sports',
    cat_noticias: 'News',
    cat_infantil: 'Kids',
    cat_musica: 'Music',
    cat_documentales: 'Documentaries',
    cat_entretenimiento: 'Entertainment',
    cat_religioso: 'Religious',
    cat_general: 'General',
    cat_abierta: 'Live TV',
    cat_favoritos: 'Favorites',

    // Modals & Extra
    later: 'Later',
    close: 'Close',
    details: 'Details',
    synopsis: 'Synopsis',
    cast_crew: 'Cast & Crew',
    genres: 'Genres',
    release_date: 'Release Date',
    duration: 'Duration',
    rating: 'Rating',
    server: 'Server',
    select_server: 'Select Server',
    back_to_app: 'Back to App',
    support_project: 'Support the Project',
    terms_and_conditions: 'Terms & Conditions',
    privacy_policy: 'Privacy',
    no_results_desc: 'No titles match the chosen combination of filters.',
    watch_now: 'Play Now',
    on_air_now: 'Now Broadcasting',
    live_247: 'Live 24/7 Programming',
    live_desc: 'High quality premium streaming with zero intrusive ads.',
    signal_status: 'Signal Status',
    excellent: 'Excellent',
    internal_id: 'Internal ID',
    more_like_this: 'More Like This',
    report_issue: 'Report an issue',
    shared_success: 'Content shared successfully',
    link_copied: 'Link copied to clipboard',
    cannot_share: 'Unable to share',
    added_to_favs: 'Added to favorites',
    removed_from_favs: 'Removed from favorites',
    report_sent: 'Report submitted. We will inspect this stream shortly.',
    tv_guide_title: 'Bring Animux to your TV',
    tv_guide_subtitle: 'No Chromecast • No Cables',
    tv_step1_title: '1. Turn on your Smart TV',
    tv_step1_desc: 'Open the built-in Web Browser or Internet app on your TV (LG, Samsung, Android TV).',
    tv_step2_title: '2. Type the address',
    tv_step2_desc: 'In the address bar at the top, type exactly:',
    tv_step3_title: '3. Use your TV Remote',
    tv_step3_desc: 'No mouse needed! Use the arrow keys to navigate and press OK / Select to start playing.',
    tv_enjoy_btn: 'Got it, let\'s watch!',
    new_version_ready: 'New Version Ready!',
    new_version_body: 'A new version of Animux has been deployed with performance upgrades, multilingual support, and dynamic themes.',
    feature_themes: 'New visual accent color themes (Palette 🎨)',
    feature_smart_tv: 'Full Smart TV & Chromecast / AirPlay support',
    feature_optimized: '100% optimized channels & streams',
    updating_btn: 'Updating...',

    // Share & Promo
    share_with_friends: 'Share with Friends',
    share_title: 'Check out what I am watching on Animux!',
    share_text: 'I recommend Animux, the best web player for movies, series, and live TV without annoying ads:',
    copied_to_clipboard: 'Link copied to clipboard!',
  },

  pt: {
    // Nav & Header
    home: 'Início',
    movies: 'Cinema (VOD)',
    movies_short: 'Filmes',
    series: 'Séries (VOD)',
    series_short: 'Séries',
    live_tv: 'TV Aberta',
    live_tv_short: 'Ao Vivo',
    favorites: 'Favoritos',
    search: 'Buscar',
    tv_guide: 'Ver na TV',
    kids_mode_on: 'Ativar Modo Kids',
    kids_mode_off: 'Desativar Modo Kids',
    refresh_data: 'Atualizar dados',
    control_center: 'Painel de Controle',
    accent_themes: 'Temas de Destaque',
    language_selector: 'Selecionar Idioma',
    terms_privacy: 'Termos e Privacidade',
    search_placeholder: 'Buscar canais, filmes, séries...',
    safe_badge: 'Seguro',
    new_version_available: 'Nova versão disponível!',
    new_version_desc: 'Melhorias de desempenho e novos canais prontos para instalar.',
    update_now: 'Atualizar Agora',
    up_to_date: 'Versão atualizada',
    last_sync: 'Última sinc',
    telegram_group: 'Canal Oficial no Telegram',
    telegram_desc: 'Peça filmes, séries ou relate transmissões diretamente.',
    join_telegram: 'Entrar no Grupo',
    reloading_data: 'Recarregando canais e filmes do Firebase',

    // Moods & Search
    what_to_watch: 'O que você quer assistir hoje?',
    mood_movies: '🍿 Filmes e Pipoca',
    mood_action: '⚡ Ação e Adrenalina',
    mood_sports: '⚽ Esportes Ao Vivo',
    mood_comedy: '😂 Comédia e Risos',
    mood_series: '📺 Maratona de Séries',
    mood_docs: '🧠 Documentários',
    mood_kids: '👶 Espaço Infantil',
    mood_music: '🎶 Música e Shows',
    searching_for: 'Buscando',
    searching_desc: 'Explore todos os canais e filmes correspondentes',
    see_results: 'Ver Resultados',
    no_results: 'Nenhum resultado correspondente foi encontrado.',
    active_filters: 'Ativos',
    explore_catalog: 'Explorar Catálogo',
    results_count: 'Resultados',
    result_singular: 'resultado',
    results_plural: 'resultados',

    // Filters
    filters: 'Filtros',
    genre: 'Gênero',
    year: 'Ano',
    popularity: 'Ordenar por',
    sort_content: 'Ordenar Conteúdo',
    select_genre: 'Selecionar Gênero',
    select_year: 'Selecionar Ano',
    all_genres: 'Todos os Gêneros',
    all_years: 'Todos os Anos',
    default_sort: 'Padrão',
    most_popular: 'Mais Populares',
    highest_rated: 'Mais Votados',
    newest: 'Lançamentos',
    title_az: 'Título (A - Z)',
    quick_filters: 'Rápido',
    clean_filters: 'Limpar',
    popular_badge: '🔥 Populares',
    rated_badge: '⭐ Mais Votados',

    // Hero
    exclusive_premiere: 'Estreia Exclusiva',
    trending: 'Em Alta',
    animux_original: 'Animux Original • Premium',
    play: 'Assistir Agora',
    info: 'Info',
    featured_title: 'Título em Destaque',
    default_hero_desc: 'Desfrute da melhor qualidade de imagem e som surround. Apenas aqui na melhor plataforma de streaming.',

    // Rows & Sections
    top_kids: 'Top Infantis',
    anime_cartoons: 'Anime e Desenhos',
    disney_nick: 'Mundo Disney e Nick',
    movies_vod: 'Filmes (VOD)',
    series_vod: 'Séries (VOD)',
    live_sports: 'Esportes Ao Vivo',
    continue_watching: 'Continuar Assistindo',
    explore_all: 'Explorar Tudo',

    // Categories translation mapping
    cat_inicio: 'Início',
    cat_cine: 'Cinema (VOD)',
    cat_series: 'Séries (VOD)',
    cat_deportes: 'Esportes',
    cat_noticias: 'Notícias',
    cat_infantil: 'Infantil',
    cat_musica: 'Música',
    cat_documentales: 'Documentários',
    cat_entretenimiento: 'Entretenimento',
    cat_religioso: 'Religioso',
    cat_general: 'Geral',
    cat_abierta: 'TV Aberta',
    cat_favoritos: 'Favoritos',

    // Modals & Extra
    later: 'Mais Tarde',
    close: 'Fechar',
    details: 'Detalhes',
    synopsis: 'Sinopse',
    cast_crew: 'Elenco',
    genres: 'Gêneros',
    release_date: 'Data de Lançamento',
    duration: 'Duração',
    rating: 'Avaliação',
    server: 'Servidor',
    select_server: 'Selecionar Servidor',
    back_to_app: 'Voltar ao App',
    support_project: 'Apoiar o Projeto',
    terms_and_conditions: 'Termos e Condições',
    privacy_policy: 'Privacidade',
    no_results_desc: 'Nenhum conteúdo corresponde à combinação de filtros selecionada.',
    watch_now: 'Assistir Agora',
    on_air_now: 'No ar agora',
    live_247: 'Programação ao vivo 24/7',
    live_desc: 'Streaming premium de alta qualidade sem anúncios intrusivos.',
    signal_status: 'Status do Sinal',
    excellent: 'Excelente',
    internal_id: 'ID Interno',
    more_like_this: 'Mais como isto',
    report_issue: 'Relatar problema',
    shared_success: 'Conteúdo compartilhado',
    link_copied: 'Link copiado para a área de transferência',
    cannot_share: 'Não foi possível compartilhar',
    added_to_favs: 'Adicionado aos favoritos',
    removed_from_favs: 'Removido dos favoritos',
    report_sent: 'Relatório enviado. Analisaremos este canal em breve.',
    tv_guide_title: 'Leve o Animux para sua TV',
    tv_guide_subtitle: 'Sem Chromecast • Sem Cabos',
    tv_step1_title: '1. Ligue sua Smart TV',
    tv_step1_desc: 'Abra o Navegador Web ou Internet instalado na sua TV (LG, Samsung, Android TV).',
    tv_step2_title: '2. Digite o endereço',
    tv_step2_desc: 'Na barra de endereços acima, digite exatamente:',
    tv_step3_title: '3. Use o Controle Remoto',
    tv_step3_desc: 'Não precisa de mouse! Use as setas para navegar e aperte OK / Select para reproduzir.',
    tv_enjoy_btn: 'Entendido, vamos assistir!',
    new_version_ready: 'Nova Versão Pronta!',
    new_version_body: 'Uma nova versão do Animux foi implantada com melhorias de desempenho, suporte a idiomas e temas dinâmicos.',
    feature_themes: 'Novos temas de cores visuais (Paleta 🎨)',
    feature_smart_tv: 'Suporte total para Smart TV e Chromecast / AirPlay',
    feature_optimized: 'Canais e transmissões 100% otimizados',
    updating_btn: 'Atualizando...',

    // Share & Promo
    share_with_friends: 'Compartilhar com Amigos',
    share_title: 'Veja o que estou assistindo no Animux!',
    share_text: 'Recomendo o Animux, o melhor player de filmes, séries e TV ao vivo sem anúncios chatos:',
    copied_to_clipboard: 'Link copiado para a área de transferência!',
  }
};

const LanguageContext = createContext();

export const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('animux_lang');
    if (saved && TRANSLATIONS[saved]) return saved;
    const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (TRANSLATIONS[browserLang]) return browserLang;
  } catch (e) {
    console.error('Error detecting language:', e);
  }
  return 'es';
};

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(getInitialLanguage);

  const changeLanguage = (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setCurrentLang(langCode);
      try {
        localStorage.setItem('animux_lang', langCode);
        document.documentElement.lang = langCode;
      } catch (e) {
        console.error(e);
      }
    }
  };

  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
    return dict[key] || TRANSLATIONS.es[key] || fallback || key;
  };

  const translateCategory = (catName) => {
    if (!catName) return '';
    const norm = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (norm === 'inicio' || norm === 'home') return t('cat_inicio');
    if (norm.includes('cine') || norm.includes('movie') || norm.includes('pelicula')) return t('cat_cine');
    if (norm.includes('serie')) return t('cat_series');
    if (norm.includes('deporte') || norm.includes('sport')) return t('cat_deportes');
    if (norm.includes('noticia') || norm.includes('news')) return t('cat_noticias');
    if (norm.includes('infantil') || norm.includes('kid') || norm.includes('dibujo') || norm.includes('anime')) return t('cat_infantil');
    if (norm.includes('musica') || norm.includes('music')) return t('cat_musica');
    if (norm.includes('docu')) return t('cat_documentales');
    if (norm.includes('entreten') || norm.includes('variedad')) return t('cat_entretenimiento');
    if (norm.includes('religio') || norm.includes('fe')) return t('cat_religioso');
    if (norm.includes('abierta') || norm.includes('vivo') || norm.includes('live')) return t('cat_abierta');
    if (norm.includes('favorito') || norm.includes('fav')) return t('cat_favoritos');
    return catName;
  };

  useEffect(() => {
    try {
      document.documentElement.lang = currentLang;
    } catch (e) {}
  }, [currentLang]);

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage: changeLanguage, t, translateCategory, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackT = (key, fallback = '') => TRANSLATIONS.es[key] || fallback || key;
    return {
      currentLang: 'es',
      setLanguage: () => {},
      t: fallbackT,
      translateCategory: (cat) => cat,
      languages: LANGUAGES,
    };
  }
  return context;
};
