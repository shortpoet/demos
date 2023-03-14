<template>
  <button data-cy="counter-btn" class="counter-btn" type="button" @click="state.count++">Counter {{ state.count
  }}</button>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
const state = reactive({ count: 0 })
</script>
