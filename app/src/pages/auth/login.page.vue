<template>
  <div class="page-container" flex-col items-center flex>
    <Link :href="`/auth`" :title="'back'">
    <i class="i-carbon-page-first" inline-block /><span>back</span>
    </Link>

    <Login :use-popup="false">
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
          id="logout-button" :disabled="!logoutProps.isLoggedIn === true" @click="logoutProps.onLogout">Log out</button>
      </template>
    </Login>
  </div>
</template>

<script lang="ts">
import Link from '~/components/Link.vue';
import Login from '~/components/Login.vue';
export default {
  components: { Link, Login }
}
</script>
