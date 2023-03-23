<template>
  <div class="page-container">
    <div>
      <h1>Health</h1>
      <Link :href="`/api-data`" :title="'back'">
      <i class="i-carbon-page-first" inline-block />
      </Link>

      <!-- <div v-if="loaded === false">
        <p>Loading...</p>
      </div> -->
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
import { useFetch } from '~/composables/fetch';
import { User } from '~/types';
// import { useAuthStore } from '~/stores/auth';

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
    let user = ref({} as User);
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

    const { useAuth, defaultOptions } = await import("~/composables/auth");
    const { user: u } = await useAuth(defaultOptions);
    user = u;
    const urlBase = `${import.meta.env.VITE_APP_URL}`;

    const options = { token: user.value.token };
    // const options = { user: user.value };
    ({ dataLoading, error, data } = await useFetch(`${urlBase}/api/health/check`, options));

    return { data, loaded, error, user };
  },
}
</script>
