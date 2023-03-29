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
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK, setSession, SESSION_TOKEN_EXPIRY } from '~/composables/auth-plugin';
import UserLayout from '~/layouts/UserLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
import { usePageContext } from '~/composables/pageContext';
import MainNav from '~/components/MainNav.vue';
import { COOKIES_SESSION_TOKEN, cookieOptions } from '~/composables/cookies';

const loading = ref(true);
const pageContext = usePageContext();
console.log('AuthLayout.pageContext: isAdmin -> ', pageContext.pageProps?.isAdmin);
let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : UserLayout;
const pageComponent = computed(() => {
  return Layout;
});

onMounted(async () => {
  // console.log('AuthLayout.onMounted.before');
  // await setTimeout(() => {
  //   console.log('AuthLayout.onMounted.timeout');
  //   loading.value = false;
  // }, 1000);
  // console.log('AuthLayout.onMounted.after: loading ->', loading.value);

  const authP = useAuthPlugin();
  await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
  const user = await authP?.onLoad();
  if (user) {
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log('onLoad.setSession.user: ', user);
    }
    const seshRes = await setSession(user);
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_SESSION_TOKEN]);

    if (seshRes && seshRes.status === 'Success') {

      cookies.set(COOKIES_SESSION_TOKEN, seshRes.result, {
        ...cookieOptions('set'),
        maxAge: SESSION_TOKEN_EXPIRY,
      });

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('onLoad.setSession: ', COOKIES_SESSION_TOKEN);
        console.log(JSON.stringify(seshRes, null, 2));
        console.log('onLoad.setSession.cookies: ', cookies.getAll());
        console.log('onLoad.setSession.cookies: ', cookies.get(COOKIES_SESSION_TOKEN));
      }
    } else {

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.error('error setting session: ', seshRes);
      }
      cookies.remove(COOKIES_SESSION_TOKEN, cookieOptions('remove'));
    }
  }
  loading.value = false;
})
</script>
