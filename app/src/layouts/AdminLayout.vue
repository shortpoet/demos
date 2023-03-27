<template>
  <div class="content admin-layout">
    <h1>ADMIN LAYOUT</h1>
    <slot name="default" />
  </div>
</template>

<style scoped>
@import url('~/styles/admin-layout.css');
</style>

<script lang="ts" setup>
// this isn't reloaded when navigating to a new page that is a chile of this layout
</script>
