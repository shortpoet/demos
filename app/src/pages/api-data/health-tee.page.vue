<template>
  <div class="page-container">
    <div>
      <h1>Health Tee</h1>
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

    <!-- <h1>Health Tee</h1>
    <Link :href="`/api-data`" :title="'back'">
    <i class="i-carbon-page-first" inline-block />
    </Link>

    <Suspense>
      <template #fallback v-if="!loaded">
        <h1 class="text-4xl font-bold">Loading...</h1>
      </template>
      <template #default v-else>
        <pre v-if="healthError">{{ healthError }}</pre>
        <div v-else>
          <JsonTree :data="health" />
        </div>
      </template>
    </Suspense> -->

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

import AuthLayout from '~/layouts/AuthLayout.vue';

export { AuthLayout }

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  setup() {
    const loaded = computed(() => healthLoaded.value && authLoading.value)
    const healthError = ref(null);
    const healthLoaded = ref(false);
    const health = ref({});
    const user = ref({} as User);
    const authLoading = ref(false);

    if (typeof window === "undefined") {
      return {
        health,
        loaded,
        healthError,
      }
    }

    (async () => {

      const { useAuth, defaultOptions } = await import("~/composables/auth");
      const { user: u, authLoading: l } = await useAuth(defaultOptions);
      user.value = u.value;
      authLoading.value = l.value;

      const options = { token: user.value ? user.value.token : null };

      const { valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>("api/health/debug",
        options, health, healthLoaded, healthError);

      health.value = valueRef.value;
      healthError.value = errorRef.value;
      healthLoaded.value = loadingRef.value;
      console.log({ valueRef, errorRef, loadingRef });

      // watch([valueRef, errorRef, loadingRef], () => {
      //   health.value = valueRef.value;
      //   healthError.value = errorRef.value;
      //   healthLoaded.value = loadingRef.value;
      // });

    })();

    // watch(authLoading, (cur, prev) => {
    //   console.log(`health-tee.page.authLoading changed from ${prev} to ${cur}`);
    // });

    return { health, loaded, healthError };
  },
}
</script>
