<template>
  <div>
    <h1>Verifying access... Redirecting after login...</h1>
  </div>
</template>

<script lang="ts">
// import { useHead } from '@vueuse/head';
// layout is for auth load

export default {
  setup() {
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    // useHead({
    //   script: [
    //     {
    //       src: 'https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js',
    //       crossorigin: 'anonymous',
    //       async: true,
    //       onload: async () => {
    //         console.log('health-pee.auth0 loaded');
    //         await auth?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    //         await auth?.onLoad();
    //       },
    //     },
    //   ]
    // });
  },
};
</script>
    
