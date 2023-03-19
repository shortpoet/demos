<template>
  <div>
    <slot name="login" :onLogin="onLogin" />
  </div>
  <div>
    <slot name="logout" :onLogout="onLogout" />
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
import { ref, watch } from 'vue';
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
    let isLoggedIn = ref(false);
    let user = ref({} as GithubUser);
    // onMounted(() => console.log("onMounted gets called before mounted() because it is in setup"));
    (async () => {
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        // console.log("login.typeof window !== 'undefined' -> can now load things that would break SSR");
        const { useAuth, defaultOptions } = await import("~/composables/auth");
        const { isLoggedIn: a, user: u } = await useAuth(defaultOptions);
        isLoggedIn.value = a.value;
        user.value = u.value;
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
      // console.log("login.component.isLoggedIn changed");
      // console.log(currentValue);
      // console.log(oldValue);

    });
    const c = ctx;
    const slots = c.slots;
    const loginSlot = slots.login;
    return {
      onLogin,
      onLogout,
      loginSlot,
      isLoggedIn,
      user
    }
  },
}
</script>
