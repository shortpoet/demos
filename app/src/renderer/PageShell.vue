<template>
  <div class="layout">
    <div class="navigation">
      <a href="/" class="logo">
        <img :src="logoUrl" height="64" width="64" alt="logo" />
      </a>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/star-wars">Star Wars</Link>
      <Link href="/auth">Auth</Link>
      <Link href="/auth0">Auth0</Link>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head';
import { computed } from 'vue';
import Link from '~/components/Link.vue';
import { useAuth, defaultOptions } from '~/composables/auth';

import logoUrl from '/logo.svg';

console.log('logoUrl', logoUrl);

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
    {

      src: 'https://cdn.auth0.com/js/auth0/9.18/auth0.min.js',
      crossorigin: 'anonymous',
      async: true,
      onload: async () => {
        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
        const { onLoad } = await useAuth(defaultOptions);
        console.log('auth0 loaded');
        return onLoad
      },
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

<style>
body {
  margin: 0;
  font-family: sans-serif;
}

* {
  box-sizing: border-box;
}

a {
  text-decoration: none;
}
</style>

<style scoped>
.layout {
  display: flex;
  max-width: 900px;
  margin: auto;
}

.content {
  padding: 20px;
  border-left: 2px solid #eee;
  padding-bottom: 50px;
  min-height: 100vh;
}

.navigation {
  padding: 20px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.8em;
}

.logo {
  margin-top: 20px;
  margin-bottom: 10px;
}
</style>
