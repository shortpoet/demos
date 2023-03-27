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
// import { useHead } from '@vueuse/head';
// import { title, meta, link } from '~/types';
import { computed, onMounted, ref } from 'vue';
import { useAuthPlugin, DEFAULT_REDIRECT_CALLBACK, setSession, cookieOptions, COOKIES_SESSION_TOKEN, SESSION_TOKEN_EXPIRY } from '~/composables/auth-plugin';
import AuthLayout from '~/layouts/UserLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
import { usePageContext } from '~/composables/pageContext';
import MainNav from '~/components/MainNav.vue';

// const slots = useSlots();
// const loginSlot = slots.login;
const loading = ref(true);
const pageContext = usePageContext();
console.log('suspenseLayout.pageContext: isAdmin -> ', pageContext.pageProps?.isAdmin);
let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : AuthLayout;
const pageComponent = computed(() => {
  return Layout;
});


onMounted(async () => {
  // console.log('suspenseLayout.onMounted.before');
  // await setTimeout(() => {
  //   console.log('suspenseLayout.onMounted.timeout');
  //   loading.value = false;
  // }, 1000);
  // console.log('suspenseLayout.onMounted.after: loading ->', loading.value);

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
        ...cookieOptions,
        maxAge: SESSION_TOKEN_EXPIRY,
      });

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('onLoad.setSession.cookies: ', cookies.getAll());
      }
    } else {

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.error('error setting session: ', seshRes);
      }
      cookies.remove(COOKIES_SESSION_TOKEN);
    }
  }
  loading.value = false;
})

// useHead({
//   // title,
//   script: [
//     {
//       src: 'https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js',
//       crossorigin: 'anonymous',
//       async: true,
//       onload: async () => {
//         console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
//         // const { onLoad } = await useAuth(defaultOptions);
//         // console.log('auth0 loaded');
//         // await onLoad();
//         // the self-executing function below fires multiple times
//         // return onLoad
//         // const authP = useAuthPlugin();
//         // await authP?.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
//         // await authP?.onLoad();
//       },
//     },
//     // {
//     //   src: 'https://cdn.auth0.com/js/auth0/9.18/auth0.min.js',
//     //   crossorigin: 'anonymous',
//     //   async: true,
//     // },
//   ],
//   // meta,
//   // link,
// })
</script>
