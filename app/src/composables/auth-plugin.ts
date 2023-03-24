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

import { ref, Ref, computed, watch, inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

import { navigate } from 'vite-plugin-ssr/client/router';
import { CookieSetOptions } from 'universal-cookie';
import { User } from '~/types';
import { useFetchTee } from './fetchTee';

export {
  useAuthPlugin,
  DEFAULT_REDIRECT_CALLBACK,
  Auth0Client,
  ClientOptions,
  defaultOptions,
  COOKIES_USER_TOKEN,
  cookieOptions,
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
  user: Ref<User>;
  authLoading: Ref<boolean>;
  authError: Ref<any>;
  popupOpen: Ref<boolean>;
  createAuthClient: (
    onRedirectCallback: (appState: any) => void,
    redirect_uri?: string,
    options?: ClientOptions,
  ) => Promise<void>;
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

const AuthSymbol = Symbol() as InjectionKey<Auth0Instance>;

// interface Auth0Instance {
//   $auth: this;
// }

const DEFAULT_REDIRECT_CALLBACK = (appState: any = {}) =>
  // window.history.replaceState(appState, document.title, window.location.pathname);
  navigate(
    appState && appState.loginRedirectPath
      ? appState.loginRedirectPath
      : window.location.pathname,
  );

// let instance: Auth0Instance;

const authClient = ref<Auth0Client | null>(null);
let redirectCallback: (appState: any) => void;
// const redirectCallback = ref(DEFAULT_REDIRECT_CALLBACK);
const user = ref<User>({} as User);
const token = ref<string>();
const authLoading = ref(true);
const popupOpen = ref(false);
const error = ref<any>();
const isLoggedIn = ref(false);
const audience = `https://ssr.shortpoet.com`;
const scope = 'openid profile email';
const response_type = 'code';

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

export const provideAuth = () => {
  const auth = {
    user,
    authLoading,
    popupOpen,
    isLoggedIn,
    authError: error,

    createAuthClient,
    onLoad,
    handleRedirectCallback,
    isAuthenticated,
    loginWithPopup,
    loginWithRedirect,
    logout,
    getTokenSilently,
    // getIdTokenClaims,
    // getTokenWithPopup,
  };

  provide(AuthSymbol, auth);
};

export const isClient = typeof window !== 'undefined';
const defaultWindow: (Window & typeof globalThis) | undefined =
  /* #__PURE__ */ isClient ? window : undefined;

const awaitWindowPromise = async (
  window: Window | undefined,
): Promise<Window> => {
  if (!window) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (window) {
          clearInterval(interval);
          resolve(window);
        }
      }, 100);
    });
  }
  return window;
};

const useAuthPlugin = (window = defaultWindow) => {
  // await awaitWindowPromise(window);
  // if (!window) {
  //   return;
  // }
  const auth = inject(AuthSymbol);
  // if (!auth) {
  //   return;
  // }
  return auth as Auth0Instance;
};

const defaultOptions: ClientOptions = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  useRefreshTokens: true,
  cacheLocation: 'localstorage',
  onRedirectCallback: (appState: any) => {
    navigate(
      appState && appState.loginRedirectPath
        ? appState.loginRedirectPath
        : window.location.pathname,
    );
  },
};

const createAuthClient = async ({
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
  redirect_uri = import.meta.env.VITE_AUTH0_CALLBACK_URL,
  ...options
}): Promise<void> => {
  const initOptions: ClientOptions = {
    ...defaultOptions,
    ...options,
    authorizationParams: {
      scope,
      audience,
      redirect_uri: redirect_uri,
      response_type,
    },
  };
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    // console.log('createAuthClient', initOptions);
  }
  authClient.value = await createAuth0Client(initOptions);
  redirectCallback = onRedirectCallback;
};

async function onLoad() {
  try {
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_USER_TOKEN]);
    const hasToken = cookies.get(COOKIES_USER_TOKEN);
    console.log(`plugin hasToken and bool: ${[hasToken, hasToken === true]}`);
    if (
      window.location.search.includes('code=') &&
      window.location.search.includes('state=')
    ) {
      const res = await authClient.value?.handleRedirectCallback();
      redirectCallback(res?.appState);
    } else if (hasToken === true) {
      if (!authClient.value) {
        return;
      }
      const tokenRes = await authClient.value.getTokenSilently({
        detailedResponse: true,
      });
      // console.log(`tokenRes: ${JSON.stringify(tokenRes)}`);
      token.value = tokenRes?.id_token;
    }
  } catch (err) {
    console.error(`error: ${err}`);
    error.value = err;
    authLoading.value = false;
  } finally {
    authLoading.value = false;
    console.log(`finally: authLoading plugin -> ${authLoading.value}`);
    user.value = (await authClient.value?.getUser()) || ({} as User);
    isLoggedIn.value = (await authClient.value?.isAuthenticated()) || false;
    if (isLoggedIn.value === true && user.value) {
      token.value = (await authClient.value?.getTokenSilently()) || '';
      user.value.token = token.value;
      const seshRes = await setSession(user.value);
      if (seshRes && seshRes !== 'Ok') {
        console.error(`seshRes: ${seshRes}`);
      }
    }
  }
}
const setSession = async (user: User) => {
  console.log(`setSession.user: ${JSON.stringify(user, null, 2)}`);
  const options = { user };
  let res;
  const { data, error, dataLoading } = await useFetchTee<{ result: string }>(
    'api/auth/session',
    options,
  );
  if (error.value) {
    console.error(`error: ${error.value}`);
    res = 'Error';
  }
  if (dataLoading.value) {
    console.log(`dataLoading: ${dataLoading.value}`);
    res = 'Loading';
  }
  if (data.value) {
    console.log(`data: ${JSON.stringify(data.value, null, 2)}`);
    res = data.value?.result;
  }
  return res;
};

async function handleRedirectCallback() {
  authLoading.value = true;
  try {
    if (!authClient.value) {
      return;
    }
    const { appState } = await authClient.value.handleRedirectCallback();
    // console.log(`handleRedirectCallback: appState: ${appState}`);
    user.value = (await authClient.value.getUser()) || ({} as User);
    isLoggedIn.value = true;
    // window.history.replaceState({}, document.title, window.location.pathname);
    redirectCallback(appState);
    return appState;
  } catch (e) {
    console.error(e);
    error.value = e;
    authLoading.value = false;
  } finally {
    authLoading.value = false;
  }
}

async function isAuthenticated() {
  const authenticated = (await authClient.value?.isAuthenticated()) || false;
  if (authenticated !== isLoggedIn.value) {
    isLoggedIn.value = authenticated || false;
  }
  return authenticated;
}

async function getTokenSilently(
  options?: GetTokenSilentlyOptions,
): Promise<string>;
async function getTokenSilently(
  options: GetTokenSilentlyOptions & { detailedResponse: true },
): Promise<GetTokenSilentlyVerboseResponse>;
async function getTokenSilently(options?: any): Promise<any> {
  if (options?.detailedResponse) {
    return await authClient.value?.getTokenSilently({
      ...options,
      detailedResponse: true,
    });
  } else {
    return await authClient.value?.getTokenSilently(options);
  }
}

async function loginWithRedirect(
  o: RedirectLoginOptions = {
    appState: {
      loginRedirectPath: window.location.pathname,
    },
  },
) {
  authLoading.value = true;
  try {
    const res = await authClient.value?.loginWithRedirect(o);
    return res;
  } catch (e) {
    console.error(e);
    error.value = e;
    authLoading.value = false;
  } finally {
    authLoading.value = false;
  }
}

async function loginWithPopup(o: PopupLoginOptions = {}) {
  popupOpen.value = true;
  authLoading.value = true;
  try {
    const res = await authClient.value?.loginWithPopup(o);
    return res;
  } catch (e) {
    console.error(e);
    error.value = e;
    authLoading.value = false;
  } finally {
    popupOpen.value = false;
    user.value = (await authClient.value?.getUser()) || ({} as User);
    isLoggedIn.value = (await authClient.value?.isAuthenticated()) || false;
    token.value = await authClient.value?.getTokenSilently();
    if (user.value) user.value.token = token.value || '';
    // because no redirect we set this here vs in onLoad
    // console.log(`isLoggedIn: ${isLoggedIn.value}`);
    // console.log(`user: ${JSON.stringify(user.value)}`);
    authLoading.value = false;
  }
}

async function logout(
  o: LogoutOptions = {
    openUrl: async (defaultUrl) => {
      // console.log(`logout: openUrl: ${defaultUrl}`);
      window.location.replace(window.location.origin + '/auth/login');
    },
  },
) {
  await authClient.value?.logout(o);
  user.value = {} as User;
  isLoggedIn.value = false;
}
