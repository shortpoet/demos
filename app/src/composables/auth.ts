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

import { navigate } from "vite-plugin-ssr/client/router";

export { Auth0Client, ClientOptions, useAuth, defaultOptions };

interface ClientOptions extends Auth0ClientOptions {
  domain: string;
  clientId: string;
  audience?: string;
  redirect_uri?: string;
  useRefreshTokens?: boolean;
  cacheLocation?: "memory" | "localstorage";
  leeway?: number;
  onRedirectCallback?(appState: any): void;
}

interface Auth0Instance extends Partial<Auth0Client> {
  isLoggedIn: Ref<boolean>;
  user: Ref<any>;
  loading: Ref<boolean>;
  popupOpen: Ref<boolean>;
  onLoad: Promise<void>;
  isAuthenticated: () => Promise<boolean>;
  loginWithPopup(o?: PopupLoginOptions): Promise<void>;
  handleRedirectCallback(url?: string): Promise<RedirectLoginResult>;
  logout(options?: LogoutOptions): Promise<void>;
  loginWithRedirect(o?: RedirectLoginOptions): Promise<void>;
  // getIdTokenClaims(): Promise<IdToken | undefined>;
  // getTokenSilently(
  //   options: GetTokenSilentlyOptions & {
  //     detailedResponse: true;
  //   }
  // ): Promise<GetTokenSilentlyVerboseResponse>;
  // getTokenSilently(options?: GetTokenSilentlyOptions): Promise<string>;
  // getTokenWithPopup(o?: GetTokenWithPopupOptions): Promise<string | undefined>;
}

// interface Auth0Instance {
//   $auth: this;
// }

const DEFAULT_REDIRECT_CALLBACK = (state: any = {}) =>
  window.history.replaceState(state, document.title, window.location.pathname);

// let instance: Auth0Instance;

const user = ref<any>();
const loading = ref(true);
const popupOpen = ref(false);
const error = ref<any>();

const defaultOptions: ClientOptions = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  useRefreshTokens: true,
  onRedirectCallback: (appState: any) => {
    console.log("onRedirectCallback");
    navigate(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    );
  },
};

const useAuth = async ({
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
  redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL,
  ...options
}): Promise<Auth0Instance> => {
  // if (instance) return instance;
  // console.log("useAuth");

  const audience = `https://ssr.shortpoet.com`;

  const initOptions: ClientOptions = {
    ...options,
    domain: options.domain,
    clientId: options.clientId,
    authorizationParams: {
      scope: "openid profile email",
      audience,
      redirect_uri: redirectUri,
      response_type: "code",
    },
  };

  const auth0Client = await createAuth0Client(initOptions);
  const isLoggedIn = ref(await auth0Client.isAuthenticated());

  return {
    user,
    loading,
    popupOpen,
    isLoggedIn,
    onLoad: (async () => {
      // console.log("onLoad");
      try {
        if (
          window.location.search.includes("code=") &&
          window.location.search.includes("state=")
        ) {
          console.log("onLoad: handleRedirectCallback");
          const { appState } = await auth0Client.handleRedirectCallback();
          console.log("onLoad: handleRedirectCallback: after");
          console.log(`onLoad: appState: ${JSON.stringify(appState)}`);
          onRedirectCallback(appState);
        }
      } catch (err) {
        console.error(`error: ${err}`);
        error.value = err;
      } finally {
        loading.value = false;
      }
      // console.log("onLoad: after finally");
      isLoggedIn.value = await auth0Client.isAuthenticated();
      user.value = await auth0Client.getUser();
      // console.log(`onLoad: user: ${JSON.stringify(user.value)}`);
      // console.log(`onLoad: isLoggedIn: ${isLoggedIn.value}`);
    })(),
    handleRedirectCallback: async () => {
      console.log("handleRedirectCallback");
      loading.value = true;
      try {
        const { appState } = await auth0Client.handleRedirectCallback();
        user.value = await auth0Client.getUser();
        isLoggedIn.value = true;
        // window.history.replaceState({}, document.title, window.location.pathname);
        onRedirectCallback(appState);
        return appState;
      } catch (e) {
        // eslint-disable-next-line
        console.error(e);
        // error = e;
      } finally {
        loading.value = false;
      }
    },
    isAuthenticated: async () => {
      const authenticated = await auth0Client.isAuthenticated();
      if (authenticated !== isLoggedIn.value) {
        isLoggedIn.value = authenticated;
      }
      return authenticated;
    },
    loginWithRedirect: async (o) => {
      console.log("loginWithRedirect");
      loading.value = true;
      try {
        const res = await auth0Client.loginWithRedirect(o);
        return res;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    },
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
      isLoggedIn.value = true;
    },
    logout: async (o) => {
      await auth0Client.logout(o);
      user.value = undefined;
      isLoggedIn.value = false;
    },
  };
};

//   handleRedirectCallback,
//   getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
//   loginWithRedirect: (...p) => auth0Client.loginWithRedirect(...p),
//   getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
//   getTokenWithPopup: (...p) => auth0Client.getTokenWithPopup(...p),
//   logout: (...p) => auth0Client.logout(...p),

// if (
//   window.location.search.includes("code=") &&
//   window.location.search.includes("state=")
// ) {
//   const { appState } = await auth0Client.handleRedirectCallback();
//   onredire(appState);
// }

// watch(
//   () => isLoggedIn.value,
//   (isLoggedIn) => {
//     if (isLoggedIn) {
//       user.value = auth0Client.getUser();
//     }
//   }
// );

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
