import { Auth0Instance, NextAuthInstance, User } from '../../types';
import { InjectionKey, ref, provide, inject } from 'vue';
import { CookieSetOptions } from 'universal-cookie';

export {
  COOKIES_SESSION_TOKEN,
  COOKIES_USER_TOKEN,
  SESSION_TOKEN_EXPIRY,
  cookieOptions,
};

const AuthSymbol: InjectionKey<NextAuthInstance> = Symbol();

// const authClient = ref<Auth0Client | null>(null);
// let redirectCallback: (appState: any) => void;
// const redirectCallback = ref(DEFAULT_REDIRECT_CALLBACK);
const user = ref<User | undefined>();
const token = ref<string>();
const authLoading = ref(true);
const popupOpen = ref(false);
const error = ref<any>();
const isLoggedIn = ref(false);
const audience = `https://ssr.shortpoet.com`;
const scope = 'openid profile email offline_access';
const response_type = 'code';

const COOKIES_USER_TOKEN = `${import.meta.env.VITE_APP_NAME}-next-user-token`;
const COOKIES_SESSION_TOKEN = `${
  import.meta.env.VITE_APP_NAME
}-next-session-token`;
const SESSION_TOKEN_EXPIRY = 60 * 60; // 1 hour

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

    // createAuthClient,
    // onLoad,
    // handleRedirectCallback,
    // isAuthenticated,
    // loginWithPopup,
    // loginWithRedirect,
    // logout,
    // getTokenSilently,
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

const useAuthPlugin = () => {
  const auth = inject(AuthSymbol);
  if (!auth) throw new Error('setPageContext() not called in parent');
  return auth as Auth0Instance;
};
