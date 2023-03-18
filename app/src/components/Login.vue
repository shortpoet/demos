<template>
  <div>
    <slot name="login" :onLogin="onLogin" />
  </div>
  <div>
    <slot name="logout" :onLogout="onLogout" />
  </div>
</template>

<script lang="ts">
import { ref, watch } from 'vue';
import { useHead } from '@vueuse/head';
import { useAuth } from '~/composables/auth';

export default {
  props: {
    usePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, ctx) {
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    useHead({
      // TODO look into how the title affects back button text
      script: [
        {
          src: "https://cdn.auth0.com/js/auth0/9.13.2/auth0.min.js",
          async: true,
          defer: true,
          onload: async () => {
            if (isLoggedIn.value === true) {
              return;
            }
            const { checkAuth, authOptions } = useAuth();
            const url = new URL(window.location.href).href;
            await checkAuth({
              ...authOptions,
              appState: { ...authOptions.appState, loginRedirectPath: url, usePopup: props.usePopup }
            });
          },
        },
      ],
    });
    const authStore = useAuthStore();
    const isLoggedIn = ref(authStore.isLoggedIn);
    let onLogin = ref((event: any) => { console.log(`login.component.womp login ${event}`); });
    let onLogout = ref((event: any) => { console.log(`login.component.womp logout ${event}`); });
    // onMounted(() => console.log("onMounted gets called before mounted() because it is in setup"));
    (async () => {
      if (typeof window !== "undefined") {
        // console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
        // console.log("login.component.isLoggedIn", authStore.isLoggedIn);
        const { useAuth } = await import("~/composables/auth");
        const { login, logout, authOptions } = useAuth();
        onLogin.value = (event: any) => {
          login({
            ...authOptions,
            appState: {
              ...authOptions.appState,
              loginRedirectPath: window.location.pathname,
              usePopup: props.usePopup
            }
          });
          isLoggedIn.value = authStore.isLoggedIn;
        };
        onLogout.value = (event: any) => {
          logout();
          isLoggedIn.value = authStore.isLoggedIn;
        };
      }
    })();
    watch(isLoggedIn, (currentValue, oldValue) => {
      console.log("login.component.isLoggedIn changed");
      console.log(currentValue);
      console.log(oldValue);
    });
    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;
    // return () => ctx.slots.default({
    //   error: error.value
    // })
    return {
      onLogin,
      onLogout,
      loginSlot,
      isLoggedIn,
    }
  },
}
</script>
