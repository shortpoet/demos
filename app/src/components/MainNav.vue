<template>
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
</template>

<script setup lang="ts">
import Link from '~/components/Link.vue';
import logoUrl from '../../public/logo.svg';
</script>