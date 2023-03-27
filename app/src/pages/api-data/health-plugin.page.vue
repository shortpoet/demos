<template>
  <div class="page-container">
    <div>
      <h1>Health Plugin</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>
      <pre v-if="error">{{ error }}</pre>
      <div v-else>
        <JsonTree :data="data" />
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
import { computed, Ref, ref } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { User } from '~/../types';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
import { useFetchTee } from '~/composables/fetchTee';

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup() {
    const loaded = computed(() => dataLoading && true)
    let dataLoading = ref(false);
    let error = ref(null);
    let data: Ref<any> = ref();

    if (typeof window === "undefined") {
      return {
        data,
        loaded,
        error,
      }
    }

    let user = ref(undefined as User | undefined);

    const auth = useAuthPlugin();

    await auth.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await auth.onLoad();

    if (auth?.user.value) {
      user = auth?.user;
    }

    // const urlBase = `${import.meta.env.VITE_APP_URL}`;

    const options = { user: user.value };
    ({ dataLoading, error, data } = await useFetchTee(`api/health/check`, options));

    return { data, loaded, error, user };
  },
}
</script>
