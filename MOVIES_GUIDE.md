# 🎬 Guía para Añadir Películas en Animux

Para añadir películas personalizadas a tu aplicación, solo necesitas editar el archivo:
`public/movies.json`

## 🛠 Estructura del archivo
El archivo debe contener una lista de objetos entre corchetes `[]`. Aquí tienes el formato exacto que debes seguir:

```json
[
  {
    "id": "peli-001",
    "title": "NOMBRE DE LA PELÍCULA",
    "name": "NOMBRE DE LA PELÍCULA",
    "logo": "URL_DEL_POSTER (Imagen)",
    "category": "Cine Premium",
    "rating": 9.5,
    "year": "2024",
    "description": "Una breve descripción de qué trata la película.",
    "url": "URL_DEL_STREAM (m3u8, mp4 o YouTube)",
    "isVOD": true
  }
]
```

## 📝 Explicación de los campos:
1.  **id**: Un identificador único (no puede haber dos iguales). Ej: `peli-1`, `peli-2`.
2.  **title / name**: El nombre que aparecerá en la aplicación.
3.  **logo**: El link de la imagen del poster.
    - *Tip:* Puedes usar [TMDB](https://www.themoviedb.org/) para buscar cualquier película y copiar el link de su poster.
4.  **category**: Pon siempre `"Cine Premium"` o `"Filmes"` para que aparezca en la sección correcta.
5.  **rating**: Un número del 1 al 10 para las estrellas.
6.  **url**: El enlace del video. Puede ser:
    - Un enlace directo `.m3u8` o `.mp4`.
    - Un enlace de **YouTube** (ej: `https://www.youtube.com/watch?v=...`).
7.  **isVOD**: Ponlo siempre en `true` para que el reproductor active los controles de tiempo (pausa, adelantar).

## 💡 Consejos:
- Asegúrate de poner una **coma `,`** entre cada película, excepto en la última.
- Si la aplicación se queda en negro tras editar el archivo, revisa que no te falte ninguna comilla o llave.
- ¡Puedes añadir tantas como quieras! La app las organizará automáticamente.
