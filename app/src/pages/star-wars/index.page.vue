<template>
  <div class="page-container">
    <div>
      <h1>Star Wars Movies</h1>
      Interactive while loading:
      <Counter />
      <div v-if="loaded === false">
        <p>Loading...</p>
      </div>
      <div v-else>
        <ol>
          <li :key="movie.id" v-for="movie in movies">
            {{ movie.title }} ({{ movie.release_date }})
          </li>
        </ol>
      </div>

    </div>

  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
}
</style>
  
<script lang="ts">
import { Ref, ref } from 'vue';
import Counter from '~/components/Counter.vue'

type Movie = {
  id: string
  title: string
  release_date: string
}
async function getMovies(response: any): Promise<Movie[]> {
  const moviesFromApi = (await response.json()).results as MovieFromApi[]
  const movies = cleanApiResult(moviesFromApi)
  return movies
}

type MovieFromApi = {
  title: string
  release_date: string
  director: string
  producer: string
}

function cleanApiResult(moviesFromApi: MovieFromApi[]): Movie[] {
  const movies = moviesFromApi.map((movie, i) => {
    const { title, release_date } = movie
    return {
      id: String(i + 1),
      title,
      release_date
    }
  })
  return movies
}


export default {
  components: {
    Counter
  },
  setup() {
    const loaded = ref(false);
    const movies: Ref<Movie[]> = ref([]);
    (async () => {
      try {
        const res = await await fetch('https://star-wars.brillout.com/api/films.json')
        await new Promise((r) => setTimeout(r, 2 * 1000));
        movies.value = await getMovies(res);
        loaded.value = true;
      } catch (error) {
        console.error(error);
      }
    })();
    return { movies, loaded };
  },
}
</script>
