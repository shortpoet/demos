<template>
  <div class="page-container" flex-col items-center flex>

    <!-- <ApiViewer url="/auth/data" :options="{ headers: { Authorization: 'Bearer myToken' } }"> -->
    <!-- <ApiViewer url="http://localhost:3000/auth/debug">
      <template #default="{ data }">
        <pre>{{ JSON.parse(JSON.stringify(data), null, 2) }}</pre>
      </template>
    </ApiViewer> -->

    <!-- <JsonTree :data="data" /> -->

    <nav>
      <Link btn href="/auth/login" title="Login">Login</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/health">Health</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/debug">Debug</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/health-tee">Health Tee</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/health-plugin">Health Plugin</Link>
    </nav>

    <!-- <div class="api-content">
      <slot />
    </div> -->

  </div>
</template>

<script lang="ts" setup>
// import ApiViewer from '~/components/ApiViewer.vue';
// import JsonTree from '~/components/JsonTree.vue';
import Link from '~/components/Link.vue';

// const attrs = `
//       bg-purple-300
//       hover:bg-purple-400
//       dark:bg-purple-400
//       dark:hover:bg-purple-500
//       font-mono
//       font-light
//       p-y-2
//       p-x-4
//       border-2
//       rounded
//       border-purple-200`
const attrsObj = {
  bg: 'blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600',
  // text: 'sm white', // this causes a bug that changes inner html
  font: 'mono light',
  p: 'y-2 x-4',
  border: '2 rounded blue-200',
};
</script>
<script lang="ts">
export { onBeforeRender } from './onBeforeRender'
</script>
