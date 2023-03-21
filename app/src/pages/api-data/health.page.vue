<template>
  <div class="page-container">
    <div>
      <h1>Health</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>

      <div v-if="loaded === false">
        <p>Loading...</p>
      </div>
      <pre v-else-if="healthError">{{ healthError }}</pre>
      <div v-else>
        <JsonTree :data="health" />
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
import { computed, ref, watch } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useFetch } from '~/composables/fetch';
import { User } from '~/types';
// import { useAuthStore } from '~/stores/auth';

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  setup() {
    let user = ref({} as User);
    const loaded = computed(() => healthLoaded && true)
    const healthError = ref(null);
    const healthLoaded = ref(false);
    const health = ref(null);

    const fetchData = async (idToken?: string) => {
      const urlBase = `${import.meta.env.VITE_APP_URL}`;
      const options = { token: idToken }
      const getHealth = useFetch(`${urlBase}/api/health/check`, options);
      await getHealth.fetchApi();

      if (getHealth.error.value) {
        healthError.value = getHealth.error.value;
        healthLoaded.value = !!getHealth.isLoading;
      } else if (getHealth.data.value && !!getHealth.isLoading) {
        healthError.value = null;
        health.value = getHealth.data.value;
        healthLoaded.value = !!getHealth.isLoading;
      }
    }

    (async () => {
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {

        const { useAuth, defaultOptions } = await import("~/composables/auth");
        const { user: u } = await useAuth(defaultOptions);
        user = u;
        if (user.value) {
          await fetchData(user.value.token);
        } else {
          await fetchData();
        }
      }
    })();
    watch(() => user, async () => {
      console.log('user changed');
      if (user.value) {
        await fetchData(user.value.token);
      } else {
        await fetchData();
      }
    });

    return { health, loaded, healthError, user };
  },
}
</script>
