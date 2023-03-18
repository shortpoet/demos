import {
  Auth0Client,
  Auth0ClientOptions,
  createAuth0Client,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
  IdToken,
  LogoutOptions,
  PopupLoginOptions,
  RedirectLoginOptions,
  RedirectLoginResult,
  TokenEndpointOptions,
  GetTokenSilentlyVerboseResponse,
} from "@auth0/auth0-spa-js";

import { ref, Ref, computed, watch } from "vue";

interface ClientOptions extends Auth0ClientOptions {
  domain: string;
  client_id: string;
  audience?: string;
  redirect_uri?: string;
  useRefreshTokens?: boolean;
  cacheLocation?: "memory" | "localstorage";
  leeway?: number;
  onRedirectCallback?(appState: any): void;
}

interface Auth0PluginOptions {
  onRedirectCallback?(appState: any): void;
}

interface Auth0Plugin {
  install(app: any, options: Auth0PluginOptions): void;
}

interface Auth0PluginInstance {
  isAuthenticated: Ref<boolean>;
  user: Ref<any>;
  loading: Ref<boolean>;
  popupOpen: Ref<boolean>;
  loginWithPopup(o?: PopupLoginOptions): Promise<void>;
  handleRedirectCallback(url?: string): Promise<RedirectLoginResult>;
  getIdTokenClaims(): Promise<IdToken | undefined>;
  loginWithRedirect(o?: RedirectLoginOptions): Promise<void>;
  getTokenSilently(o?: GetTokenSilentlyOptions): Promise<string | undefined>;
  getTokenWithPopup(o?: GetTokenWithPopupOptions): Promise<string | undefined>;
  logout(o?: LogoutOptions): void;
}

interface Auth0PluginInstance {
  $auth: Auth0PluginInstance;
}

const DEFAULT_REDIRECT_CALLBACK = () =>
  window.history.replaceState({}, document.title, window.location.pathname);

let instance: Auth0PluginInstance;

export const Auth0Plugin: Auth0Plugin = {
  install(Vue, options: Auth0PluginOptions = {}) {
    const redirectCallback =
      options.onRedirectCallback || DEFAULT_REDIRECT_CALLBACK;

    Vue.mixin({
      beforeCreate() {
        if (this.$options.auth0) {
          instance = this.$options.auth0;
        } else if (this.$parent && this.$parent.$auth) {
          this.$auth = this.$parent.$auth;
        }
      },
    });

    Vue.prototype.$auth = instance;

    Vue.component("auth0-login-button", {
      props: {
        label: {
          type: String,
          default: "Login",
        },
      },
      methods: {
        login() {
          instance.loginWithRedirect();
        },
      },
      template: `<button @click="login">{{ label }}</button>`,
    });

    Vue.component("auth0-logout-button", {
      props: {
        label: {
          type: String,
          default: "Logout",
        },
      },
      methods: {
        logout() {
          instance.logout();
        },
      },
      template: `<button @click="logout">{{ label }}</button>`,
    });
  },
};

export const useAuth0 = (): Auth0PluginInstance => instance;

export const createAuth0Client = async (
  options: ClientOptions
): Promise<Auth0PluginInstance> => {
  const auth0Client = await createAuth0Client(options);
  const isAuthenticated = ref(await auth0Client.isAuthenticated());
  const user = ref<any>();
  const loading = ref(true);
  const popupOpen = ref(false);

  const handleRedirectCallback = async () => {
    loading.value = true;
    try {
      await auth0Client.handleRedirectCallback();
      user.value = await auth0Client.getUser();
      isAuthenticated.value = true;
    } catch (e) {
      user.value = undefined;
      isAuthenticated.value = false;
    } finally {
      loading.value = false;
    }
  };

  if (
    window.location.search.includes("code=") &&
    window.location.search.includes("state=")
  ) {
    const { appState } = await auth0Client.handleRedirectCallback();
    redirectCallback(appState);
  }

  watch(
    () => isAuthenticated.value,
    (isAuthenticated) => {
      if (isAuthenticated) {
        user.value = auth0Client.getUser();
      }
    }
  );

  return {
    isAuthenticated,
    user,
    loading,
    popupOpen,
    loginWithPopup: async (o) => {
      popupOpen.value = true;
      try {
        await auth0Client.loginWithPopup(o);
      } catch (e) {
        // eslint-disable-next-line
        console.error(e);
      } finally {
        popupOpen.value = false;
      }
      user.value = await auth0Client.getUser();
      isAuthenticated.value = true;
    },
    handleRedirectCallback,
    getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
    loginWithRedirect: (...p) => auth0Client.loginWithRedirect(...p),
    getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
    getTokenWithPopup: (...p) => auth0Client.getTokenWithPopup(...p),
    logout: (...p) => auth0Client.logout(...p),
  };
};

// // Path: app/src/main.ts

// import { createApp } from "vue";
// import App from "./App.vue";
// import router from "./router";
// import store from "./store";
// import { Auth0Plugin } from "./composables/auth";

// const app = createApp(App);

// app.use(store);

// app.use(router);

// app.use(Auth0Plugin, {
//   onRedirectCallback: (appState) => {
//     router.push(appState?.returnTo || window.location.pathname);
//   }
// });

// app.mount("#app");

// // Path: app/src/App.vue

// <template>
//   <div id="app">
//     <router-view />
//   </div>
// </template>

// <script lang="ts">
// import { defineComponent } from "vue";
// import { useAuth0 } from "./composables/auth";

// export default defineComponent({
//   name: "App",
//   setup() {
//     const { loading } = useAuth0();
//     return {
//       loading,
//     };
//   }
// });
// </script>

// // Path: app/src/views/Home.vue

// <template>
//   <div class="home">
//     <h1>Home</h1>
//     <auth0-login-button />
//     <auth0-logout-button />
//   </div>
// </template>

// <script lang="ts">
// import { defineComponent } from "vue";
// import { useAuth0 } from "../composables/auth";

// export default defineComponent({
//   name: "Home",
//   setup() {
//     const { isAuthenticated, user, loading } = useAuth0();
//     return {
//       isAuthenticated,
//       user,
//       loading,
//     };
//   }
// });
// </script>
