<template>
  <div class="content admin-layout bg-orange-200 p-5 border-l-slate-600 border-l-2 pb-16 min-h-screen max-w-4xl">
    <h1>USER LAYOUT</h1>
    <slot name="default" />
  </div>
</template>

<style scoped>
@import url('~/styles/user-layout.css');
</style>

<script lang="ts" setup>
// import { ref } from 'vue';
// this isn't reloaded when navigating to a new page that is a chile of this layout
// ctx is shared between slots and children so ....
// https://github.com/vuejs/vue/issues/4332
// but 
// https://michaelnthiessen.com/emit-data-from-slot/
// const isLoading = ref(true);
// const handleLoad = async () => {
//   await setTimeout(() => {
//     console.log('adminLayout.onMounted.timeout');
//     console.log('adminLayout.handleLoad: isLoading -> ', isLoading.value);
//     isLoading.value = false;
//     console.log('adminLayout.handleLoad: isLoading -> ', isLoading.value);
//   }, 1000);
// }
</script>
