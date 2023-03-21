<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <div v-if="!isLoading && !error">
      <slot :data="data"></slot>
      <!-- <pre>{{ data }}</pre> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue'
import type { PropType } from 'vue'
import { useFetch, RequestConfig, requestInit } from '~/composables/fetch'

export default defineComponent({
  props: {
    url: {
      type: String,
      required: true,
      validator: (url: string) => {
        return url.startsWith('http://') || url.startsWith('https://')
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
  setup(props) {
    const { fetchApi, isLoading, error, data } = useFetch(props.url, props.options)

    const fetchData = async () => {
      await fetchApi()
    }

    fetchData()

    watch(() => props.url, fetchData)

    return {
      isLoading,
      error,
      data,
    }
  }
})
</script>
