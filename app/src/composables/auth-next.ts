import { NextAuthInstance, SetSessionResult, User } from '../../types';
import { InjectionKey, ref, provide, inject } from 'vue';
import { CookieSetOptions } from 'universal-cookie';
import { useFetch } from './fetch';
import { escapeNestedKeys } from 'app/util';
import { navigate } from 'vite-plugin-ssr/client/router';

export {
  COOKIES_SESSION_TOKEN,
  COOKIES_USER_TOKEN,
  SESSION_TOKEN_EXPIRY,
  cookieOptions,
  useNextAuth,
};

const AuthSymbol: InjectionKey<NextAuthInstance> = Symbol();

// const authClient = ref<Auth0Client | null>(null);
// let redirectCallback: (appState: any) => void;
// const redirectCallback = ref(DEFAULT_REDIRECT_CALLBACK);
const user = ref<User | undefined>();
const session = ref<any>();
const token = ref<string>();
const authLoading = ref(true);
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
    isLoggedIn,
    authError: error,

    login,
    onLoad,
    logout,
    setSession,
    // createAuthClient,
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

const useNextAuth = () => {
  const auth = inject(AuthSymbol);
  if (!auth) throw new Error('setPageContext() not called in parent');
  return auth as NextAuthInstance;
};

const setSession = async (): Promise<SetSessionResult> => {
  const url = new URL(`${process.env.NEXTAUTH_URL}/session`);
  const { data, error, dataLoading } = await useFetch<any>(url.href);
  let res: SetSessionResult = { session: undefined, status: 'Loading' };
  if (error.value) {
    // if (import.meta.env.VITE_LOG_LEVEL === 'debug')
    console.error(`error: ${error.value}`);
    res = { session: undefined, status: 'Error' };
  }
  if (dataLoading.value) {
    // if (import.meta.env.VITE_LOG_LEVEL === 'debug')
    console.log(`dataLoading: ${dataLoading.value}`);
  }
  if (data.value) {
    console.log(`data: ${JSON.stringify(data.value, null, 2)}`);
    res = { session: data.value, status: 'Success' };
  }
  return res;
};

const onLoad = async () => {
  // this conflicts with getSession on server side and causes a mini redirect loop/series of unnecessary fetches
  // const _session = await setSession();
  // if (_session.status === 'Success') {
  //   console.log(`_session: ${JSON.stringify(_session, null, 2)}`);
  //   session.value = _session.session;
  // }
  authLoading.value = false;
  return null;
};

const login = async (options?: any) => {
  let res;
  const url = new URL(`${process.env.NEXTAUTH_URL}/signin`);
  const { data, error, dataLoading } = await useFetch(url.href);
  navigate(url.pathname);
  if (error.value) {
    // if (import.meta.env.VITE_LOG_LEVEL === 'debug')
    console.error(`error: ${error.value}`);
  }

  if (dataLoading.value) {
    // if (import.meta.env.VITE_LOG_LEVEL === 'debug')
    console.log(`dataLoading: ${dataLoading.value}`);
    res = { result: 'Loading', status: 'Loading' };
  }
  if (data.value) {
    console.log(`data: ${JSON.stringify(data.value, null, 2)}`);
    // if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    //   let logObj = escapeNestedKeys({ ...data.value }, [
    //     'token',
    //     'body',
    //     'Authorization',
    //     'accessToken',
    //     'sessionToken',
    //   ]);
    //   console.log(`data: ${JSON.stringify(logObj, null, 2)}`);
    // }
  }
};

const logout = async () => {
  let res;
  const url = new URL(`${process.env.NEXTAUTH_URL}/signout`);
  const { data, error, dataLoading } = await useFetch(url.href);
  navigate(url.pathname);
  if (error.value) {
    console.error(`error: ${error.value}`);
  }

  if (dataLoading.value) {
    console.log(`dataLoading: ${dataLoading.value}`);
    res = { result: 'Loading', status: 'Loading' };
  }
  if (data.value) {
    console.log(`data: ${JSON.stringify(data.value, null, 2)}`);
  }
};
