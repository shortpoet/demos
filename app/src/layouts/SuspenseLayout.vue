<template>
  <div class="layout">
    <MainNav />
    <Suspense>
      <template v-if="loading">
        <div flex flex-col class="items-center justify-center p-5">
          <h1 class="block whitespace-pre-line bg-orange-300 p-5 rounded-xl text-center text-4xl font-bold">
            {{ `\nLoading ...` }}
          </h1>
          <slot name="fallback" />
        </div>
      </template>
      <template v-else>
        <div class="suspense-wrapper">
          <component :is="BlueLayout">
            <slot name="default" />
          </component>
        </div>
      </template>
    </Suspense>

    <!-- https://stackoverflow.com/questions/53430731/vuejs-nested-slots-how-to-pass-slot-to-grandchild -->

  </div>
</template>
<style scoped>
@import url('~/src/styles/page-shell.css');
</style>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import MainNav from '~/src/components/MainNav.vue';
import BlueLayout from './BlueLayout.vue';

const loading = ref(true);

onMounted(async () => {
  loading.value = false;
})
</script>
