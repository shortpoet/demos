<template>
  <div class="page-container">
    <h1>DEBUG TEST</h1>
    <div>
      <h1>Debug</h1>
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
import { useFetchTee } from '~/composables/fetchTee';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';


export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup(_, ctx) {
    if (typeof window === "undefined") {
      return {
        data: null,
        loaded: false,
        error: null,
      }
    }
    const authP = useAuthPlugin();
    await authP.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await authP.onLoad();
    const { user, authLoading } = authP;

    // const options = { token: user.value ? user.value.token : null };
    const options = { user: user.value };
    const { data, error, dataLoading } = await useFetchTee<Record<string, any>>(
      "api/health/debug",
      options,
    );

    const loaded = computed(() => dataLoading.value === false && authLoading.value === false)
    console.log('loaded', loaded.value)
    console.log(ctx)
    ctx.emit('loaded', loaded)

    return { data, dataLoading, error, loaded };
  },
}
</script>
