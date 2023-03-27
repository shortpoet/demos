<template>
  <div class="page-container">
    <ApiViewer :title="'Debug'" :urlPath="'api/health/debug'" :options="{ withAuth: true }" />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
}
</style>
  
<script lang="ts">
import ApiViewer from '~/components/ApiViewer.vue';

export default {
  components: {
    ApiViewer
  },
}
</script>
