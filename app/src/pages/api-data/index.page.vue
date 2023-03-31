<template>
  <div class="page-container" flex-col items-center flex>
    <nav>
      <Link btn-purple v-bind="attrsObj" href="/api-data/health">Health</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/json-file">Json File</Link>
      <Link btn-purple v-bind="attrsObj" href="/api-data/hello">Hello World</Link>
    </nav>
  </div>
</template>
<script lang="ts">
import Link from '~/src/components/Link.vue'
export default {
  components: {
    Link,
  },
  async setup(_, ctx) {
    const attrsObj = {
      bg: 'blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600',
      // text: 'sm white', // this causes a bug that changes inner html
      font: 'mono light',
      p: 'y-2 x-4',
      border: '2 rounded blue-200',
    };

    console.log('setup');
    ctx.emit('loaded', true);
    return { attrsObj };
  }
}
</script>
