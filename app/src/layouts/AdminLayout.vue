<template>
  <div class="content admin-layout bg-blue-400 p-5 border-l-slate-600 border-l-2 pb-16 min-h-screen max-w-4xl">
    <h1>ADMIN LAYOUT</h1>
    <slot name="default" />
  </div>
</template>

<style scoped>
/* @import url('~/styles/admin-layout.css'); */
</style>

<script lang="ts" setup>
// this isn't reloaded when navigating to a new page that is a chile of this layout
</script>
