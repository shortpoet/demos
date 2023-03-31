<template>
  <div class="navigation">
    <a href="/" class="logo">
      <img :src="logoUrl" height="64" width="64" alt="logo" />
    </a>
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
    <Link href="/star-wars">Star Wars</Link>
    <Link href="/api-data">Api Data</Link>
  </div>
</template>

<script setup lang="ts">
import Link from '~/src/components/Link.vue';
import logoUrl from '~/public/logo.svg';
</script>