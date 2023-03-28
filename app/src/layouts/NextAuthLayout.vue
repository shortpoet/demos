<template>
  <div class="layout">
    <MainNav />
    <Suspense>
      <template v-if="authLoading">
        <div flex flex-col class="items-center justify-center p-5">
          <h1 class="block whitespace-pre-line bg-yellow-200 p-5 rounded-xl text-center text-4xl font-bold">
            {{ `Next Auth\nSession\nLoading ...` }}
          </h1>
          <slot name="fallback" />
        </div>
      </template>
      <template v-else>
        <div class="suspense-wrapper">
          <component :is="pageComponent">
            <slot name="default" />
          </component>
        </div>
      </template>
    </Suspense>
  </div>
</template>
<style scoped>
@import url('~/styles/page-shell.css');
</style>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import AuthLayout from '~/layouts/UserLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
import { usePageContext } from '~/composables/pageContext';
import MainNav from '~/components/MainNav.vue';
import { useNextAuth } from '~/composables/auth-next';

let authLoading = ref(true);
const pageContext = usePageContext();

console.log('NextAuthLayout.pageContext: isAdmin -> ', pageContext.pageProps?.isAdmin);

let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : AuthLayout;
const pageComponent = computed(() => {
  return Layout;
});


onMounted(async () => {
  const auth = useNextAuth();
  const { onLoad } = auth;
  await onLoad();
  authLoading.value = auth.authLoading.value;
})

</script>
