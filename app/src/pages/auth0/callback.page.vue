<template>
  <div>
    <h1>Verifying access... Redirecting after login...</h1>
  </div>
</template>

<script lang="ts">
import { useHead } from '@vueuse/head';
import { navigate } from 'vite-plugin-ssr/client/router';
import { onLoad, REDIRECT_URL, setConfig } from './index.page.vue';
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
            const { HTMLConsole } = await import('../../composables/console');
            const htmlConsole = new HTMLConsole({
              selector: '#console'
            });

            if (typeof window !== "undefined") {
              console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
              console.log('callback loaded')
              parent.postMessage(window.location.hash, 'http://localhost:3000/auth0')
              setConfig(REDIRECT_URL);
              onLoad(htmlConsole, REDIRECT_URL);
              navigate('/auth0')
            }

          },
        },
      ],
    });
  },
};
</script>
    
