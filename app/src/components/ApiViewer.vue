<template>
  <div class="page-container">
    <div>
      <h1>{{ title }}</h1>
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
import { computed, PropType } from 'vue';
import Counter from '~/components/Counter.vue'
import Link from '~/components/Link.vue'
import JsonTree from '~/components/JsonTree.vue'
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
import { RequestConfig, requestInit, useFetch } from '~/composables/fetch';

export default {
  components: {
    Counter,
    Link,
    JsonTree,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    urlPath: {
      type: String,
      required: true,
      validator: (url: string) => {
        return !url.startsWith('http://') || !url.startsWith('https://') || !url.startsWith('www.') || !url.startsWith('localhost') || !url.startsWith('/')
      }
    },
    options: {
      type: Object as PropType<RequestConfig>,
      // Make sure to use arrow functions if your TypeScript version is less than 4.7
      default: () => new Request('', requestInit),
      validator: (options: RequestConfig) => {
        return options.method === 'GET' ||
          options.method === 'POST' ||
          options.method === 'PUT' ||
          options.method === 'DELETE' ||
          options.method === 'PATCH' ||
          options.method === 'OPTIONS'
      }
    }
  },

  async setup(props) {
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
    const options = {
      ...props.options,
      token: props.options.withAuth ? user.value?.token : undefined,
      user: props.options.withAuth ? user.value : undefined,
    };
    // const options = { user: user.value };
    const { dataLoading, error, data } = await useFetch(props.urlPath, options);
    const loaded = computed(() => dataLoading.value === false && authLoading.value === false)
    return { data, loaded, error, user };
  },
}
</script>
