<template>
  <div class="page-container" flex-col items-center flex>
    <Link :href="`/auth`" :title="'back'">
    <i class="i-carbon-page-first" inline-block /><span>back</span>
    </Link>

    <LoginPlugin>
      <template #login="loginProps">
        <button class="btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="login-button" :disabled="loginProps.isLoggedIn" @click="loginProps.onLogin">Log in</button>
      </template>
      <template #login-popup="loginPopupProps">
        <button class="btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="login-button" :disabled="loginPopupProps.isLoggedIn" @click="loginPopupProps.onLoginPopup">Log in
          Popup</button>
      </template>
      <template #logout="logoutProps">
        <button class="btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="logout-button" :disabled="logoutProps.authError" @click="logoutProps.onLogout">Log
          out</button>
      </template>
    </LoginPlugin>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import Link from '~/components/Link.vue';
import LoginPlugin from '~/components/LoginPlugin.vue';

import AuthLayout from '~/layouts/AuthLayout.vue';
let Layout = AuthLayout;
export { Layout }

export default {
  components: { Link, LoginPlugin },
  setup(props, ctx) {
    // const { slots, attrs } = ctx;
    // console.log(JSON.parse(JSON.stringify(slots)));
    const loading = ref(true);
    setTimeout(() => {
      loading.value = false;
    }, 50);
    return { loading };
  }
}
</script>
