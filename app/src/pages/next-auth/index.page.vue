<script lang="ts">
import Link from '~/components/Link.vue';

export default {
  setup() {
  },
  components: {
    Link,
    // Link: () => import('~/components/Link.vue'),
  },
};

</script>
<style></style>
<template>
  <div class="page-container" flex-col items-center flex>
    <nav>
      <Link btn-purple m-1 p-1 href="/auth/login">Login</Link>
      <!-- <Link btn-purple m-1 p-1 href="/auth/callback">Callback</Link> -->
    </nav>
  </div>
</template>