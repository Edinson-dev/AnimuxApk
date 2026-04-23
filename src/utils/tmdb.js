const TMDB_API_KEY = 'e547e17d4e91f3e62a571655cd1ccaff'; // USER can add their key here
const BASE_URL = 'https://api.themoviedb.org/3';

export const getMovieDetails = async (title) => {
  if (!TMDB_API_KEY) return null;
  
  try {
    const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=es-ES`);
    const searchData = await searchRes.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      return {
        description: movie.overview,
        poster: movie.backdrop_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` : null,
        rating: movie.vote_average,
        year: movie.release_date?.split('-')[0],
        tmdbId: movie.id
      };
    }
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
  }
  return null;
};
