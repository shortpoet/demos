<template>
  <div class="layout">
    <MainNav />
    <Suspense>
      <template v-if="loading">
        <div flex flex-col class="items-center justify-center p-5">
          <h1 class="block whitespace-pre-line bg-orange-300 p-5 rounded-xl text-center text-4xl font-bold">
            {{ `Auth\nSession\nLoading ...` }}
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

    <!-- https://stackoverflow.com/questions/53430731/vuejs-nested-slots-how-to-pass-slot-to-grandchild -->

  </div>
</template>
<style scoped>
@import url('~/styles/page-shell.css');
</style>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK } from '~/composables/auth-plugin';
import UserLayout from '~/layouts/UserLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
import { usePageContext } from '~/composables/pageContext';
import MainNav from '~/components/MainNav.vue';
// import { COOKIES_SESSION_TOKEN, cookieOptions, COOKIES_USER_TOKEN } from '~/composables/cookies';
// import { navigate } from 'vite-plugin-ssr/client/router';
// import { escapeNestedKeys } from '../../../app/util';

const loading = ref(true);
const pageContext = usePageContext();
console.log('AuthLayout.pageContext: isAdmin -> ', pageContext.pageProps?.isAdmin);
let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : UserLayout;
const pageComponent = computed(() => {
  return Layout;
});

onMounted(async () => {
  console.log('AuthLayout.onMounted.before');
  // await setTimeout(() => {
  //   console.log('AuthLayout.onMounted.timeout');
  //   loading.value = false;
  // }, 1000);

  const authP = useAuthPlugin();
  await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
  const user = await authP?.onLoad();
  if (user) {
    console.log('AuthLayout.onMounted: user ->', user);
    const session = await authP?.setSession(user);
    if (session) {
      console.log('AuthLayout.onMounted: session ->', session);
      loading.value = false;
    } else {
      console.log('AuthLayout.onMounted: session ->', session);
      loading.value = false;
    }
  } else {
    console.log('AuthLayout.onMounted: user ->', user);
    loading.value = false;
  }
  console.log('AuthLayout.onMounted.after: loading ->', loading.value);
})
</script>
