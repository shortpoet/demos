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
import MainNav from '~/src/components/MainNav.vue';
import { meta, title, link } from '~/types';
useHead({
  title,
  meta,
  link,
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
@import url('~/src/styles/page-shell.css');
</style>
