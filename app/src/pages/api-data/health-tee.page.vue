<template>
  <div class="page-container">
    <div>
      <h1>Health Tee</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>
      <pre v-if="healthError">{{ healthError }}</pre>
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
import { computed, ref } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useFetchTee } from '~/composables/fetchTee';

import { DEFAULT_REDIRECT_CALLBACK, useAuthPlugin } from '~/composables/auth-plugin';
import AuthLayout from '~/layouts/AuthLayout.vue';
let Layout = AuthLayout;
export { Layout }

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup() {
    const loaded = computed(() => healthLoaded.value && authLoading.value)
    const healthError = ref(null);
    const healthLoaded = ref(false);
    const health = ref({});

    if (typeof window === "undefined") {
      return {
        health,
        loaded,
        healthError,
      }
    }

    const authP = useAuthPlugin();

    await authP.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await authP.onLoad();
    const { user, authLoading } = authP;

    const options = { token: user.value ? user.value.token : undefined };

    const { valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>("api/health/debug",
      options, health, healthLoaded, healthError);

    health.value = valueRef.value;
    healthError.value = errorRef.value;
    healthLoaded.value = loadingRef.value;

    return { health, loaded, healthError };
  },
}
</script>
