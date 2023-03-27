<template>
  <div class="content auth-layout">
    <slot name="fallback" v-if="loading">
      <p>Loading...</p>
    </slot>
    <slot name="default" v-else />
  </div>
</template>

<style scoped>
@import url('~/styles/auth-layout.css');
</style>

<script lang="ts" setup>
defineProps<{
  loading: boolean;
}>();
</script>
