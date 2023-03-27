<template>
  <div class="content admin-layout">
    <slot name="fallback" v-if="loading">
      <p>Loading...</p>
    </slot>
    <slot name="default" v-else />
  </div>
</template>

<style scoped>
@import url('~/styles/admin-layout.css');
</style>

<script lang="ts" setup>
defineProps<{
  loading: boolean;
}>();
</script>
