<template>
  <div class="layout">
    <MainNav />
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head';
import { computed } from 'vue';
import MainNav from '~/components/MainNav.vue';

const title = 'Carlos Soriano'
const description = `
  This is a demo of SSR on the edge using cloudflare workers.
  I'm a software engineer and I love to learn new things.
  🕺
`
const image = `https://${import.meta.env.VITE_APP_URL}/pwa-512x512.png`
const imageType = 'image/png'
const imageAlt = `A PWABuilder logo.`

useHead({
  title: title,
  script: [
    // {
    //   src: 'https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js',
    //   crossorigin: 'anonymous',
    //   async: true,
    //   onload: async () => {
    //     // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
    //     // console.log
    //     // const setCookie = (name: string, value: string, days: number) => {
    //     //   const expires = new Date(Date.now() + days * 864e5).toUTCString()
    //     //   document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/'
    //     // }
    //     // setCookie('auth0.is.authenticated', 'true', 1)
    //     // const { onLoad } = await useAuth(defaultOptions);
    //     // // console.log('auth0 loaded');
    //     // await onLoad();
    //     // // the self-executing function below fires multiple times
    //     // // return onLoad

    //     // await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    //     // await authP?.onLoad();

    //   },
    // },
    {
      src: 'https://cdn.auth0.com/js/auth0/9.18/auth0.min.js',
      crossorigin: 'anonymous',
      async: true,
    },
  ],
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:alt', content: imageAlt },
    { property: 'og:image:type', content: imageType },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: import.meta.env.BASE_URL },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:site_name', content: title },
    { property: 'og:updated_time', content: new Date().toISOString() },
    { property: 'og:see_also', content: 'https://www.linkedin.com/in/carlos-soriano/' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: imageAlt },
    { name: 'twitter:image:type', content: imageType },
    { name: 'twitter:image:width', content: '1200' },
    { name: 'twitter:image:height', content: '630' },
    { name: 'twitter:url', content: import.meta.env.BASE_URL },
    { name: 'twitter:site', content: '@shortpoet8' },
    { name: 'twitter:creator', content: '@shortpoet8' },
    { name: 'twitter:label1', content: 'Written by' },
    { name: 'twitter:data1', content: 'Carlos Soriano' },
    { name: 'twitter:label2', content: 'Est. reading time' },
    { name: 'twitter:data2', content: '8 minutes' },
    { name: 'twitter:label3', content: 'Filed under' },
    { name: 'twitter:data3', content: 'Technology' },

    {
      name: 'theme-color',
      content: '#00aba9'
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon-dark.svg'
    },
    {
      rel: 'canonical',
      href: computed(() => import.meta.env.BASE_URL),
    },
  ],
})

</script>

<style scoped>
@import url('~/styles/page-shell.css');
</style>
