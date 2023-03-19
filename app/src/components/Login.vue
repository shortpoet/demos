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

export default {
  props: {
    usePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, ctx) {
    // console.log("login.component.setup");
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    // useHead({
    //   // TODO look into how the title affects back button text
    //   script: [
    //     {
    //       src: "https://cdn.auth0.com/js/auth0-spa-js/2.0.4/auth0-spa-js.production.js",
    //       async: true,
    //       defer: true,
    //       onload: async () => {
    //         // const { useConsole } = await import('~/composables/console');
    //         // const { htmlConsole } = useConsole('#console');
    //         if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    //           const { useAuth, defaultOptions } = await import("~/composables/auth");
    //           // console.log('auth0 loaded');
    //           const { onLoad } = await useAuth(defaultOptions);
    //           return onLoad
    //         }

    //       },
    //     },
    //   ],
    // });
    let onLogin = ref((event: any) => { console.log(`login.component.womp login ${event}`); });
    let onLogout = ref((event: any) => { console.log(`login.component.womp logout ${event}`); });
    let isLoggedIn = ref(false);

    // onMounted(() => console.log("onMounted gets called before mounted() because it is in setup"));
    (async () => {
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        // console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
        const { useAuth, defaultOptions } = await import("~/composables/auth");
        ({ isLoggedIn } = await useAuth(defaultOptions));
        const { loginWithRedirect, logout } = await useAuth(defaultOptions);
        onLogin.value = (event: any) => {
          loginWithRedirect();
        };
        onLogout.value = (event: any) => {
          logout();
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
