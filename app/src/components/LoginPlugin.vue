<template>
  <div v-if="loading">
    Loading...
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
      <div v-if="!user" i-carbon-bot />
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
import { ref, watch } from 'vue';
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
  async setup(props, ctx) {
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    // useHead({
    // });
    // well i thought so
    // acutlly it needs to be here i think otherwise there is a race condition
    // or not 😅
    // because now we are using suspense
    // too tricky to get the watch correct
    let onLogin = ref((event: any) => { console.log(`login.component.womp login ${event}`); });
    let onLogout = ref((event: any) => { console.log(`login.component.womp logout ${event}`); });
    let onLoginPopup = ref((event: any) => { console.log(`login.component.womp login popup ${event}`); });
    let isLoggedIn = ref(false);
    let authError = ref(null);
    let user = ref({} as GithubUser);
    let loading = ref(true);
    // onMounted(() => console.log("onMounted gets called before mounted() because it is in setup"));
    // (async () => {
    if (typeof window !== "undefined" && typeof window.document !== "undefined") {
      const { useAuth, defaultOptions } = await import("~/composables/auth");
      const { isLoggedIn: a, user: u, authLoading: l, authError: e } = await useAuth(defaultOptions);
      const { loginWithRedirect, logout, loginWithPopup } = await useAuth(defaultOptions);
      console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
      const { useCookies } = await import('@vueuse/integrations/useCookies');
      const cookies = useCookies([COOKIES_USER_TOKEN]);

      loading.value = l.value;
      console.log(`login.component.loading.value ${loading.value}`);
      isLoggedIn.value = a.value;
      user.value = u.value;
      authError.value = e.value;
      onLogin.value = async (event: any) => {
        console.log("login.component.onLogin");
        // cookie options must be in both set and remove
        cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
        await loginWithRedirect();
        loading.value = l.value;
        isLoggedIn.value = a.value;
        user.value = u.value;
        authError.value = e.value;
      };
      onLoginPopup.value = async (event: any) => {
        console.log("login.component.onLoginPopup");
        cookies.set(COOKIES_USER_TOKEN, true, cookieOptions)
        await loginWithPopup();
        loading.value = l.value;
        isLoggedIn.value = a.value;
        user.value = u.value;
        authError.value = e.value;
      };
      onLogout.value = async (event: any) => {
        console.log("login.component.onLogout");
        cookies.remove(COOKIES_USER_TOKEN, cookieOptions);
        await logout();
        loading.value = l.value;
        isLoggedIn.value = a.value;
        user.value = u.value;
        authError.value = e.value;
      };
    }
    // })();
    console.log("login.component.setup done");
    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;

    watch(loading, async (cur, prev) => {
      console.log(`login.component.loading ${cur} ${prev}`);
      loading.value = cur;
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        const { useAuth, defaultOptions } = await import("~/composables/auth");
        const { isLoggedIn: a, user: u, authLoading: l, authError: e } = await useAuth(defaultOptions);
        loading.value = l.value;
        isLoggedIn.value = a.value;
        user.value = u.value;
        authError.value = e.value;
      }
    });
    return {
      onLogin,
      onLogout,
      onLoginPopup,
      loginSlot,
      isLoggedIn,
      user,
      loading,
      authError,
    }
  },
}
</script>
