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
          src: "https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js",
          async: true,
          defer: true,
          onload: async () => {
            console.log('auth0 loaded');
            const { useConsole } = await import('../../composables/console');
            const { htmlConsole } = useConsole('#console');
            if (typeof window !== "undefined") {

              const REDIRECT_URL = window.location.origin;
              // setConfig(REDIRECT_URL);
              // onLoad(htmlConsole, REDIRECT_URL);
            }

          },
        },
      ],
    });
  },
};

</script>
<style></style>
<template>
  <div class="page-container" flex-col items-center flex>
    <nav>
      <a href="/auth/login">Login</a>
      <a href="/auth/callback">Callback</a>
      <a href="/api-data/kittens">Kittens</a>
    </nav>
  </div>
</template>