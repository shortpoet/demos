<template>
  <div class="page-container">
    <div>
      <h1>Debug Plugin</h1>
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
import { useFetchTee } from '~/composables/fetchTee';

import { DEFAULT_REDIRECT_CALLBACK, useAuthPlugin } from '~/composables/auth-plugin';

import AuthLayout from '~/layouts/AuthLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
import SuspenseLayout from '~/layouts/SuspenseLayout.vue';

// import { usePageContext } from '~/renderer/usePageContext';
// let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : AuthLayout;
// let Layout = AuthLayout;
let Layout = SuspenseLayout;
export { Layout }


export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  async setup() {
    const loaded = computed(() => dataLoading.value && authLoading.value)
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

    const authP = useAuthPlugin();
    await authP.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await authP.onLoad();
    const { user, authLoading } = authP;

    const options = { token: user.value ? user.value.token : undefined };
    ({ data, error, dataLoading } = await useFetchTee<Record<string, any>>(
      "api/health/debug",
      options,
    ));

    return { data, dataLoading, error, authLoading };
  },
}
</script>
