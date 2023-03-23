<template>
  <div class="page-container">
    <div>
      <h1>Debug</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>
      <div v-if="authLoading">
        <h1 class="text-4xl font-bold">Auth Loading...</h1>
      </div>
      <pre v-else-if="debugError">{{ debugError }}</pre>
      <div v-else>
        <JsonTree :data="debug" />
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
    const loaded = computed(() => debugLoaded.value && !authLoading.value)
    const debugError = ref(null);
    const debugLoaded = ref(false);
    const debug = ref({});

    if (typeof window === "undefined") {
      return {
        debug,
        loaded,
        debugError,
      }
    }
    const { useAuth, defaultOptions } = await import("~/composables/auth");

    const { user, authLoading } = await useAuth(defaultOptions);
    const options = { token: user.value ? user.value.token : null };

    const { valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>(
      "api/health/debug",
      options,
      debug,
      debugLoaded,
      debugError
    );

    debug.value = valueRef.value;
    debugError.value = errorRef.value;
    debugLoaded.value = loadingRef.value;

    return { debug, loaded, debugError, authLoading };

  },
}
</script>
