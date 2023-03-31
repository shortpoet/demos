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
import Link from '~/src/components/Link.vue'
import JsonTree from '~/src/components/JsonTree.vue'
import { RequestConfig, requestInit, useFetch } from '~/src/composables/fetch';

export default {
  components: {
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
          options.method === 'OPTIONS' ||
          options.withAuth === true ||
          options.withAuth === false
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

    const options = {
      ...props.options,
    };
    // const options = { user: user.value };
    const { dataLoading, error, data } = await useFetch(props.urlPath, options);
    const loaded = computed(() => dataLoading.value === false)
    return { data, loaded, error };
  },
}
</script>
