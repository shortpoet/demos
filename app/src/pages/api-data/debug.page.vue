<template>
  <div class="page-container">
    <div>
      <h1>Debug</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>

      <div v-if="loaded === false">
        <p>Loading...</p>
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
import { computed, ref, watch } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useFetchTee } from '~/composables/fetchTee';
import { User } from '@auth0/auth0-spa-js';

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  setup() {

    let user = ref({} as User);

    const urlBase = `${import.meta.env.VITE_APP_URL}`;

    const loaded = computed(() => debugLoaded && true)
    const debugError = ref(null);
    const debugLoaded = ref(false);
    const debug = ref({});
    let valueRef = ref();
    let errorRef = ref();
    let loadingRef = ref();
    let authLoading = ref(false);

    if (typeof window === "undefined") {
      return {
        debug,
        loaded,
        debugError,
      }
    }

    (async () => {

      const url = `${urlBase}/api/health/debug`;
      console.info(`debug.page.fetching data from: -> ${url}`);
      const { useAuth, defaultOptions } = await import("~/composables/auth");
      const { user: u, authLoading: l } = await useAuth(defaultOptions);

      authLoading.value = l.value;
      if (authLoading.value === true) {
        console.log("debug.page.authLoading.value", authLoading.value);
        return;
      } else {
        console.log("debug.page.authLoading.value", authLoading.value);
        user = u;
        const options = { token: user.value ? user.value.token : null };

        ({ valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>(
          "api/health/debug",
          options,
          debug,
          debugLoaded,
          debugError
        ));

        debug.value = valueRef.value;
        debugError.value = errorRef.value;
        debugLoaded.value = loadingRef.value;
      }
    })();

    watch([valueRef, errorRef, loadingRef], async (cur, prev) => {
      console.log(`debug.page.refs changed from ${prev} to ${cur}`);
      ({ valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>(
        "api/health/debug",
        { token: user.value ? user.value.token : null },
        debug,
        debugLoaded,
        debugError
      ));
      debug.value = valueRef.value;
    });


    watch(() => [authLoading], async (cur, prev) => {
      console.log(`debug.page.authLoading changed from ${prev} to ${cur}`);
      ({ valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>(
        "api/health/debug",
        { token: user.value ? user.value.token : null },
        debug,
        debugLoaded,
        debugError
      ));
      debug.value = valueRef.value;
      debugError.value = errorRef.value;
      debugLoaded.value = loadingRef.value;
    });

    return { debug, loaded, debugError };
  },
}
</script>
