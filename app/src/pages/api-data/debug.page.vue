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
import { computed, Ref, ref } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useFetchTee } from '~/composables/fetchTee';

import AuthLayout from '~/layouts/AuthLayout.vue';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
let Layout = AuthLayout;
export { Layout }

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup() {
    const loaded = computed(() => dataLoading.value && !authLoading.value)
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

    // const { useAuth, defaultOptions } = await import("~/composables/auth");
    // const { user, authLoading } = await useAuth(defaultOptions);

    const authP = useAuthPlugin();
    await authP.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await authP.onLoad();
    const { user, authLoading } = authP;

    // const options = { token: user.value ? user.value.token : null };
    const options = { user: user.value };
    ({ data, error, dataLoading } = await useFetchTee<Record<string, any>>(
      "api/health/debug",
      options,
    ));

    return { data, dataLoading, error, authLoading };

  },
}
</script>
