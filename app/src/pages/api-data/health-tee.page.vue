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

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  setup() {
    const loaded = computed(() => healthLoaded && true)
    const healthError = ref(null);
    const healthLoaded = ref(false);
    const health = ref({});
    (async () => {

      const { valueRef, errorRef, loadingRef } = await useFetchTee<Record<string, any>>("api/health/check",
        { withAuth: false }, health, healthLoaded, healthError);

      health.value = valueRef.value;
      healthError.value = errorRef.value;
      healthLoaded.value = loadingRef.value;
      console.log({ valueRef, errorRef, loadingRef });

      watch([valueRef, errorRef, loadingRef], () => {
        health.value = valueRef.value;
        healthError.value = errorRef.value;
        healthLoaded.value = loadingRef.value;
      });

    })();

    return { health, loaded, healthError };
  },
}
</script>
