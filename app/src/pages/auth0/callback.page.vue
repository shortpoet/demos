<template>
  <div>
    <h1>Verifying access... Redirecting after login...</h1>
  </div>
</template>

<script lang="ts">
import { useHead } from '@vueuse/head';

export default {
  setup() {
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    useHead({
      // TODO look into how the title affects back button text
      script: [
        {
          src: "https://cdn.auth0.com/js/auth0/9.13.2/auth0.min.js",
          async: true,
          defer: true,
          onload: async () => {
            parent.postMessage(window.location.hash, 'http://localhost:3000/')
          },
        },
      ],
    });
  },
};
</script>
    
