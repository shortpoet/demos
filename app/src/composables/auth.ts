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
} from '@auth0/auth0-spa-js';

import { ref, Ref, computed, watch } from 'vue';

import { navigate } from 'vite-plugin-ssr/client/router';
import { CookieSetOptions } from 'universal-cookie';
import { User } from '~/types';

export {
  Auth0Client,
  ClientOptions,
  useAuth,
  defaultOptions,
  COOKIES_USER_TOKEN,
  cookieOptions,
};

const COOKIES_USER_TOKEN = `${import.meta.env.VITE_APP_NAME}-user-token`;
const cookieOptions: CookieSetOptions = {
  path: '/',
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  maxAge: 60 * 60 * 24,
  domain: 'localhost',
  sameSite: 'strict',
  // below only works in https
  // secure: true,
  // httpOnly: true,
};

interface ClientOptions extends Auth0ClientOptions {
  domain: string;
  clientId: string;
  audience?: string;
  redirect_uri?: string;
  useRefreshTokens?: boolean;
  cacheLocation?: 'memory' | 'localstorage';
  leeway?: number;
  onRedirectCallback?(appState: any): void;
}

interface Auth0Instance extends Partial<Auth0Client> {
  isLoggedIn: Ref<boolean>;
  user: Ref<any>;
  authLoading: Ref<boolean>;
  authError: Ref<any>;
  popupOpen: Ref<boolean>;
  onLoad: () => Promise<void>;
  // onLoad: Promise<void>;
  isAuthenticated: () => Promise<boolean>;
  loginWithPopup(o?: PopupLoginOptions): Promise<void>;
  handleRedirectCallback(url?: string): Promise<RedirectLoginResult>;
  logout(options?: LogoutOptions): Promise<void>;
  loginWithRedirect(o?: RedirectLoginOptions): Promise<void>;
  getTokenSilently(options?: GetTokenSilentlyOptions): Promise<string>;
  getTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true },
  ): Promise<GetTokenSilentlyVerboseResponse>;
  // getIdTokenClaims(): Promise<IdToken | undefined>;
  // getTokenWithPopup(o?: GetTokenWithPopupOptions): Promise<string | undefined>;
}

// interface Auth0Instance {
//   $auth: this;
// }

const DEFAULT_REDIRECT_CALLBACK = (state: any = {}) =>
  window.history.replaceState(state, document.title, window.location.pathname);

// let instance: Auth0Instance;

const user = ref<User>();
const token = ref<string>();
const authLoading = ref(true);
const popupOpen = ref(false);
const error = ref<any>();
const isLoggedIn = ref(false);

const defaultOptions: ClientOptions = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  useRefreshTokens: true,
  cacheLocation: 'localstorage',
  onRedirectCallback: (appState: any) => {
    // console.log('onRedirectCallback');
    // console.log(`appState: ${JSON.stringify(appState)}`);
    navigate(
      appState && appState.loginRedirectPath
        ? appState.loginRedirectPath
        : window.location.pathname,
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
      scope: 'openid profile email',
      audience,
      redirect_uri: redirectUri,
      response_type: 'code',
    },
  };

  const auth0Client = await createAuth0Client(initOptions);

  async function _getTokenSilently(
    options?: GetTokenSilentlyOptions,
  ): Promise<string>;
  async function _getTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true },
  ): Promise<GetTokenSilentlyVerboseResponse>;
  async function _getTokenSilently(options?: any): Promise<any> {
    if (options?.detailedResponse) {
      return await auth0Client.getTokenSilently({
        ...options,
        detailedResponse: true,
      });
    } else {
      return await auth0Client.getTokenSilently(options);
    }
  }

  return {
    user,
    authLoading,
    popupOpen,
    isLoggedIn,
    authError: error,
    onLoad: async () => {
      console.log('onLoad');
      try {
        const { useCookies } = await import('@vueuse/integrations/useCookies');
        const cookies = useCookies([COOKIES_USER_TOKEN]);
        const hasToken = cookies.get(COOKIES_USER_TOKEN);
        console.log(`hasToken: ${hasToken}`);
        console.log(hasToken === true);
        if (
          window.location.search.includes('code=') &&
          window.location.search.includes('state=')
        ) {
          const res = await auth0Client.handleRedirectCallback();
          onRedirectCallback(res.appState);
        } else if (hasToken === true) {
          const tokenRes = await auth0Client.getTokenSilently({
            detailedResponse: true,
          });
          // console.log(`tokenRes: ${JSON.stringify(tokenRes)}`);
          token.value = tokenRes.id_token;
        }
      } catch (err) {
        console.error(`error: ${err}`);
        error.value = err;
        authLoading.value = false;
      } finally {
        authLoading.value = false;
        console.log(`finally: authLoading -> ${authLoading.value}`);
        user.value = await auth0Client.getUser();
        isLoggedIn.value = await auth0Client.isAuthenticated();
        if (isLoggedIn.value === true && user.value) {
          token.value = await auth0Client.getTokenSilently();
          user.value.token = token.value;
        }
      }
    },
    handleRedirectCallback: async () => {
      console.log('handleRedirectCallback');
      authLoading.value = true;
      try {
        const { appState } = await auth0Client.handleRedirectCallback();
        console.log(`handleRedirectCallback: appState: ${appState}`);
        user.value = await auth0Client.getUser();
        isLoggedIn.value = true;
        // window.history.replaceState({}, document.title, window.location.pathname);
        onRedirectCallback(appState);
        return appState;
      } catch (e) {
        // eslint-disable-next-line
        console.error(e);
        error.value = e;
        authLoading.value = false;
        // error = e;
      } finally {
        authLoading.value = false;
      }
    },
    isAuthenticated: async () => {
      const authenticated = await auth0Client.isAuthenticated();
      if (authenticated !== isLoggedIn.value) {
        isLoggedIn.value = authenticated;
      }
      return authenticated;
    },
    loginWithRedirect: async (
      o: RedirectLoginOptions = {
        appState: {
          loginRedirectPath: window.location.pathname,
        },
      },
    ) => {
      console.log('loginWithRedirect');
      authLoading.value = true;
      try {
        const res = await auth0Client.loginWithRedirect(o);
        return res;
      } catch (e) {
        console.error(e);
        error.value = e;
        authLoading.value = false;
      } finally {
        authLoading.value = false;
      }
    },
    loginWithPopup: async (o) => {
      console.log('loginWithPopup');
      popupOpen.value = true;
      authLoading.value = true;
      try {
        const res = await auth0Client.loginWithPopup(o);
        return res;
      } catch (e) {
        console.error(e);
        error.value = e;
        authLoading.value = false;
      } finally {
        popupOpen.value = false;
        user.value = await auth0Client.getUser();
        isLoggedIn.value = await auth0Client.isAuthenticated();
        token.value = await auth0Client.getTokenSilently();
        if (user.value) user.value.token = token.value;
        // because no redirect we set this here vs in onLoad
        // console.log(`isLoggedIn: ${isLoggedIn.value}`);
        // console.log(`user: ${JSON.stringify(user.value)}`);
        authLoading.value = false;
      }
    },
    logout: async (
      o: LogoutOptions = {
        openUrl: async (defaultUrl) => {
          // console.log(`logout: openUrl: ${defaultUrl}`);
          window.location.replace(window.location.origin + '/auth/login');
        },
      },
    ) => {
      await auth0Client.logout(o);
      user.value = undefined;
      isLoggedIn.value = false;
    },
    getTokenSilently: _getTokenSilently,
  };
};

// onLoad: (async () => {
//   // console.log("onLoad");
//   try {
//     if (
//       window.location.search.includes('code=') &&
//       window.location.search.includes('state=')
//     ) {
//       console.log('onLoad: handleRedirectCallback');
//       const res = await auth0Client.handleRedirectCallback();
//       console.log('onLoad: handleRedirectCallback: after');
//       console.log(`onLoad: res: ${JSON.stringify(res)}`);
//       onRedirectCallback(res.appState);
//     }
//   } catch (err) {
//     console.error(`error: ${err}`);
//     error.value = err;
//   } finally {
//     authLoading.value = false;
//   }
//   console.log('onLoad: after finally');
//   isLoggedIn.value = await auth0Client.isAuthenticated();
//   user.value = await auth0Client.getUser();
//   console.log(`onLoad: user: ${JSON.stringify(user.value)}`);
//   console.log(`onLoad: isLoggedIn: ${isLoggedIn.value}`);
// })(),

//   handleRedirectCallback,
//   getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
//   loginWithRedirect: (...p) => auth0Client.loginWithRedirect(...p),
// getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
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
//     const { authLoading } = useAuth0();
//     return {
//       authLoading,
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
//     const { isAuthenticated, user, authLoading } = useAuth0();
//     return {
//       isAuthenticated,
//       user,
//       authLoading,
//     };
//   }
// });
// </script>
