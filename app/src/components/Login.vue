<template>
  <div v-if="authLoading">
    authLoading...
  </div>
  <div v-else-if="authError">
    <div>
      <slot name="logout" :onLogout="onLogout" :isLoggedIn="isLoggedIn" />
    </div>
    <div>
      {{ authError }}
    </div>
  </div>
  <div v-else>
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
      <div v-if="!user.sub" i-carbon-bot />
      <div v-else>
        <li>
          <img :src="user.picture" class="w-8 h-8 rounded-full" />
        </li>
        <li>{{ user.name }}</li>
        <li>{{ user.nickname }}</li>
      </div>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { cookieOptions, COOKIES_USER_TOKEN, COOKIES_SESSION_TOKEN, DEFAULT_REDIRECT_CALLBACK, useAuthPlugin } from '~/composables/auth-plugin';

export default {
  props: {
    usePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  async setup(props, ctx) {
    let onLogin = ref((event: any) => { console.log(`login.component.womp login ${event}`); });
    let onLogout = ref((event: any) => { console.log(`login.component.womp logout ${event}`); });
    let onLoginPopup = ref((event: any) => { console.log(`login.component.womp login popup ${event}`); });

    let isLoggedIn = ref(false);
    let authError = ref(null);
    let user = ref();
    let authLoading = ref(true);

    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;


    if (typeof window === "undefined") {
      return {
        onLogin,
        onLogout,
        onLoginPopup,
        loginSlot,
        isLoggedIn,
        user,
        authLoading,
        authError,
      }
    }
    console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");

    const authP = useAuthPlugin();

    await authP.createAuthClient(DEFAULT_REDIRECT_CALLBACK);
    await authP.onLoad();

    try {
      // at some point this might throw the refresh_token not found error
      // await authP.onLoad();
    } catch (error) {
      //
      console.error(`login.component.authP.onLoad() error: ${error}`);
    }
    ({ user, authLoading, authError } = authP);
    const { loginWithRedirect, logout, loginWithPopup } = authP;

    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_USER_TOKEN]);

    console.log(`login.component.authLoading.value ${authLoading.value}`);

    onLogin.value = async (event: any) => {
      console.log("login.component.onLogin");
      // cookie options must be in both set and remove
      cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
      await loginWithRedirect();

    };
    onLoginPopup.value = async (event: any) => {
      console.log("login.component.onLoginPopup");
      cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
      await loginWithPopup();
    };
    onLogout.value = async (event: any) => {
      console.log("login.component.onLogout");
      cookies.remove(COOKIES_USER_TOKEN, cookieOptions);
      cookies.remove(COOKIES_SESSION_TOKEN, cookieOptions)
      await logout();
    };

    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log("login.component.setup done");
    }

    // watch(authLoading, async (cur, prev) => {
    //   console.log(`login.component.loading ${cur} ${prev}`);
    //   authLoading.value = cur;
    //   ({ user, authLoading, authError } = authP);
    // });
    return {
      onLogin,
      onLogout,
      onLoginPopup,
      loginSlot,
      isLoggedIn,
      user,
      authLoading,
      authError,
    }
  },
}
</script>
