<template>
  <div class="page-container" flex-col items-center flex>

    <Login :use-popup="false">
      <template #login="loginProps">
        <button class="c-yellow btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="login-button" :disabled="isLoggedIn" @click="loginProps.loginWithPopup">Log in</button>
      </template>
      <template #logout="logoutProps">
        <button class="c-yellow btn m-3 text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          id="logout-button" :disabled="isLoggedIn" @click="logoutProps.logout">Log out</button>
      </template>
    </Login>

    <Link :href="`/`" :title="'back'">
    <i class="i-carbon-page-first" inline-block /><span>back</span>
    </Link>

  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import Link from '~/components/Link.vue';
import Login from '~/components/Login.vue';
import { useAuth, defaultOptions } from '~/composables/auth';

// import { useAuthStore } from '~/stores/auth';
// const authStore = useAuthStore();
// const isLoggedIn = ref(authStore.isLoggedIn);
let isLoggedIn = ref(false);

export default {
  setup() {
    (async () => {
      if (typeof window !== "undefined" && typeof window.document !== "undefined") {
        ({ isLoggedIn } = await useAuth(defaultOptions));
      }
    })();
    return { isLoggedIn };
  },
  components: { Link, Login }
}
</script>
