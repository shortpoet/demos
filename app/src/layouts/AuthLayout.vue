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
// import { title, meta, link } from '~/types';
import { onMounted } from 'vue';
import Link from '~/components/Link.vue';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK, setSession, cookieOptions, COOKIES_SESSION_TOKEN, SESSION_TOKEN_EXPIRY } from '~/composables/auth-plugin';

import logoUrl from '../../public/logo.svg';

onMounted(async () => {
  const authP = useAuthPlugin();
  await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
  const user = await authP?.onLoad();
  if (user) {
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log('onLoad.setSession.user: ', user);
    }
    const seshRes = await setSession(user);
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_SESSION_TOKEN]);
    if (seshRes && seshRes.status === 'Success') {
      cookies.set(COOKIES_SESSION_TOKEN, seshRes.result, {
        ...cookieOptions,
        maxAge: SESSION_TOKEN_EXPIRY,
      });
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('onLoad.setSession.cookies: ', cookies.getAll());
      }
    } else {
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.error('error setting session: ', seshRes);
      }
      cookies.remove(COOKIES_SESSION_TOKEN);
    }
  }
})

// useHead({
//   // title,
//   script: [
//     {
//       src: 'https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js',
//       crossorigin: 'anonymous',
//       async: true,
//       onload: async () => {
//         console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
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
//     // {
//     //   src: 'https://cdn.auth0.com/js/auth0/9.18/auth0.min.js',
//     //   crossorigin: 'anonymous',
//     //   async: true,
//     // },
//   ],
//   // meta,
//   // link,
// })
</script>
