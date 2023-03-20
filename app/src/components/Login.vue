<template>
  <div>
    <slot name="login" :onLogin="onLogin" :isLoggedIn="isLoggedIn" />
  </div>
  <div>
    <slot name="login-popup" :onLoginPopup="onLoginPopup" :isLoggedIn="isLoggedIn" />
  </div>
  <div>
    <slot name="logout" :onLogout="onLogout" :isLoggedIn="isLoggedIn" />
  </div>
  <ul>
    <li>User Info</li>
    <div v-if="!user" i-carbon-bot />
    <div v-else>
      <li>
        <img :src="user.picture" class="w-8 h-8 rounded-full" />
      </li>
      <li>{{ user.name }}</li>
      <li>{{ user.nickname }}</li>
    </div>
  </ul>
</template>

<script lang="ts">
import { ref } from 'vue';
import { cookieOptions, COOKIES_USER_TOKEN } from '~/composables/auth';
import { GithubUser } from '~/types';

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
    // useHead({
    // });
    // well i thought so
    let onLogin = ref((event: any) => { console.log(`login.component.womp login ${event}`); });
    let onLogout = ref((event: any) => { console.log(`login.component.womp logout ${event}`); });
    let onLoginPopup = ref((event: any) => { console.log(`login.component.womp login popup ${event}`); });
    let isLoggedIn = ref(false);
    let user = ref({} as GithubUser);
    // onMounted(() => console.log("onMounted gets called before mounted() because it is in setup"));
    (async () => {
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        // console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
        const { useCookies } = await import('@vueuse/integrations/useCookies');
        const cookies = useCookies([COOKIES_USER_TOKEN]);

        const { useAuth, defaultOptions } = await import("~/composables/auth");
        const { isLoggedIn: a, user: u } = await useAuth(defaultOptions);
        isLoggedIn.value = a.value;
        user.value = u.value;
        const { loginWithRedirect, logout, loginWithPopup } = await useAuth(defaultOptions);
        onLogin.value = async (event: any) => {
          console.log("login.component.onLogin");
          // cookie options must be in both set and remove
          cookies.set(COOKIES_USER_TOKEN, "true", cookieOptions)
          await loginWithRedirect();
          isLoggedIn.value = a.value;
          user.value = u.value;
        };
        onLoginPopup.value = async (event: any) => {
          console.log("login.component.onLoginPopup");
          cookies.set(COOKIES_USER_TOKEN, "true", cookieOptions)
          await loginWithPopup();
          isLoggedIn.value = a.value;
          user.value = u.value;
        };
        onLogout.value = async (event: any) => {
          console.log("login.component.onLogout");
          cookies.remove(COOKIES_USER_TOKEN, cookieOptions);
          await logout();
        };
      }
    })();
    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;
    return {
      onLogin,
      onLogout,
      onLoginPopup,
      loginSlot,
      isLoggedIn,
      user
    }
  },
}
</script>
