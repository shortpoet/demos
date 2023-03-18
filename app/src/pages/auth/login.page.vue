<template>
  <div class="page-container" flex-col items-center flex>

    <Login :use-popup="false">
      <template #login="loginProps">
        <button class="c-yellow btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="login-button" :disabled="isLoggedIn" @click="loginProps.onLogin">Log in</button>
      </template>
      <template #logout="logoutProps">
        <button class="c-yellow btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="logout-button" :disabled="isLoggedIn" @click="logoutProps.onLogout">Log out</button>
      </template>
    </Login>

    <Link :href="`/api-data`" :title="'back'">
    <i class="i-carbon-page-first" inline-block /><span>back</span>
    </Link>

  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import Link from '~/components/Link.vue';
import Login from '~/components/Login.vue';
// import { useAuthStore } from '~/stores/auth';
// const authStore = useAuthStore();
// const isLoggedIn = ref(authStore.isLoggedIn);
const isLoggedIn = ref(false);

export default {
  setup() {
    return { isLoggedIn };
  },
  components: { Link, Login }
}
</script>
