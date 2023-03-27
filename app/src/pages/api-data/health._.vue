<template>
  <div class="page-container">
    <div>
      <h1>Health</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>
      <div v-if="!loaded">
        <h1 class="text-4xl font-bold">Loading...</h1>
      </div>
      <pre v-else-if="error">{{ error }}</pre>
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
import { computed } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
import { useFetch } from '~/composables/fetch';

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup() {
    if (typeof window === "undefined") {
      return {
        data: null,
        loaded: false,
        error: null,
      }
    }

    const { user, authLoading, createAuthClient, onLoad } = useAuthPlugin();

    await createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await onLoad();
    const options = { token: user.value?.token };
    // const options = { user: user.value };
    const { dataLoading, error, data } = await useFetch(`api/health/check`, options);
    const loaded = computed(() => dataLoading.value === false && authLoading.value === false)
    return { data, loaded, error, user };
  },
}
</script>
