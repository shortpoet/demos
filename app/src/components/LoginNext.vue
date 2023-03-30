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
      <div v-if="!session?.expires" i-carbon-bot />
      <div v-else>
        {{ session }}
      </div>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import {
  // cookieOptions,
  // COOKIES_USER_TOKEN,
  // COOKIES_SESSION_TOKEN, 
  useNextAuth
} from '~/composables/auth-next';
import { usePageContext } from '~/composables/pageContext';

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

    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;



    if (typeof window === "undefined") {
      return {
        onLogin,
        onLogout,
        onLoginPopup,
        loginSlot,
        isLoggedIn: false,
        user: null,
        authLoading: true,
        authError: null,
      }
    }
    console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
    const auth = useNextAuth();
    const { login, logout, user, authLoading, authError, isLoggedIn } = auth;

    const pageContext = usePageContext();
    const session = pageContext.session;

    try {
      // at some point this might throw the refresh_token not found error
      // await authP.onLoad();
    } catch (error) {
      //
      console.error(`login.component.authP.onLoad() error: ${error}`);
    }

    // const { useCookies } = await import('@vueuse/integrations/useCookies');
    // const cookies = useCookies([COOKIES_USER_TOKEN]);

    console.log(`login.component.authLoading.value ${authLoading.value}`);

    onLogin.value = async (event: any) => {
      console.log("login.component.onLogin");
      // cookie options must be in both set and remove
      // cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
      await login();

    };
    onLoginPopup.value = async (event: any) => {
      console.log("login.component.onLoginPopup");
      // cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
      // await loginWithPopup();
    };
    onLogout.value = async (event: any) => {
      console.log("login.component.onLogout");
      // cookies.remove(COOKIES_USER_TOKEN, cookieOptions);
      // cookies.remove(COOKIES_SESSION_TOKEN, cookieOptions)
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
      session,
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
