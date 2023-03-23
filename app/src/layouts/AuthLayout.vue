<template>
  <div class="layout">
    <div class="navigation">
      <a href="/" class="logo">
        <img :src="logoUrl" height="64" width="64" alt="logo" />
      </a>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/star-wars">Star Wars</Link>
      <Link href="/api-data">Api Data</Link>
      <Link href="/auth">Auth</Link>
      <Link href="/auth0">Auth0</Link>
    </div>
    <Suspense>
      <template #fallback>
        <p>Loading...</p>
      </template>
      <template #default>
        <div class="content">
          <slot />
        </div>
      </template>
    </Suspense>


  </div>
</template>
<style scoped>
@import url('~/styles/auth-layout.css');
</style>

<script lang="ts" setup>
// import { useHead } from '@vueuse/head';
import { onMounted } from 'vue';
import Link from '~/components/Link.vue';
// import { useAuth, defaultOptions } from '~/composables/auth';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
// import { title, meta, link } from '~/types';

import logoUrl from '../../public/logo.svg';

onMounted(async () => {
  if (typeof window === "undefined") {
    return {
    }
  }

  const authP = useAuthPlugin();
  await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
  await authP?.onLoad();
})

// useHead({
//   title,
//   script: [
//     {
//       src: 'https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js',
//       crossorigin: 'anonymous',
//       async: true,
//       onload: async () => {
//         // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
//         // const { onLoad } = await useAuth(defaultOptions);
//         // console.log('auth0 loaded');
//         // await onLoad();
//         // the self-executing function below fires multiple times
//         // return onLoad
//         // const authP = useAuthPlugin();
//         // await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
//         // await authP?.onLoad();
//       },
//     },
//     {
//       src: 'https://cdn.auth0.com/js/auth0/9.18/auth0.min.js',
//       crossorigin: 'anonymous',
//       async: true,
//     },
//   ],
//   meta,
//   link,
// })
</script>
