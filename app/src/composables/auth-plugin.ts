// import crypto from 'crypto';
import { ref, inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

import { navigate } from 'vite-plugin-ssr/client/router';

import {
  User,
  Auth0Instance,
  ClientOptions,
  Auth0Client,
  Session,
  SetSessionResult,
} from '~/../types';
import { useFetch } from './fetch';
import {
  createAuth0Client,
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
  LogoutOptions,
  PopupLoginOptions,
  RedirectLoginOptions,
} from '@auth0/auth0-spa-js';

import { Buffer } from 'buffer';
import { escapeNestedKeys } from '~/../util';
import {
  cookieOptions,
  COOKIES_SESSION_TOKEN,
  COOKIES_USER_TOKEN,
} from './cookies';

export {
  useAuthPlugin,
  DEFAULT_REDIRECT_CALLBACK,
  defaultOptions,
  SESSION_TOKEN_EXPIRY,
};

const AuthSymbol: InjectionKey<Auth0Instance> = Symbol();

const authClient = ref<Auth0Client | null>(null);
let redirectCallback: (appState: any) => void;
// const redirectCallback = ref(DEFAULT_REDIRECT_CALLBACK);
const user = ref<User | undefined>();
const session = ref<Session | undefined>();
const token = ref<string>();
const authLoading = ref(true);
const popupOpen = ref(false);
const error = ref<any>();
const isLoggedIn = ref(false);
const audience = `https://ssr.shortpoet.com`;
const scope = 'openid profile email offline_access';
const response_type = 'code';

const SESSION_TOKEN_EXPIRY = 60 * 60; // 1 hour

const DEFAULT_REDIRECT_CALLBACK = (appState: any = {}) =>
  // window.history.replaceState(appState, document.title, window.location.pathname);
  navigate(
    appState && appState.loginRedirectPath
      ? appState.loginRedirectPath
      : window.location.pathname,
  );

// let instance: Auth0Instance;

export const provideAuth = () => {
  const auth = {
    user,
    authLoading,
    popupOpen,
    isLoggedIn,
    authError: error,

    createAuthClient,
    onLoad,
    setSession,
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

const useAuthPlugin = () => {
  const auth = inject(AuthSymbol);
  if (!auth) throw new Error('setPageContext() not called in parent');
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
    // useRefreshTokens: true,
    // useRefreshTokensFallback: true,
    authorizationParams: {
      scope,
      audience,
      redirect_uri: redirect_uri,
      response_type,
    },
  };
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log('createAuthClient', initOptions);
  }
  authClient.value = await createAuth0Client(initOptions);
  redirectCallback = onRedirectCallback;
};

async function onLoad(): Promise<User | null | undefined> {
  let _user = null;
  try {
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_USER_TOKEN]);
    const hasToken = cookies.get(COOKIES_USER_TOKEN);
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log(`plugin hasToken and bool: ${[hasToken, hasToken === true]}`);
    }
    if (
      window.location.search.includes('code=') &&
      window.location.search.includes('state=')
    ) {
      const res = await authClient.value?.handleRedirectCallback();
      redirectCallback(res?.appState);
      return _user;
    } else if (hasToken === true) {
      if (!authClient.value) {
        return _user;
      }
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log(`plugin hasToken: ${hasToken}`);
      }
      const tokenRes = await authClient.value.getTokenSilently({
        detailedResponse: true,
      });
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log(`tokenRes: ${JSON.stringify(tokenRes).substring(0, 24)}`);
      }
      token.value = tokenRes?.id_token;
      user.value = (await authClient.value?.getUser()) || ({} as User);
      _user = user.value;
      return _user;
    }
  } catch (err) {
    console.error(`error: ${err}`);
    error.value = err;
    authLoading.value = false;
    return _user;
  } finally {
    authLoading.value = false;
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log(`finally: authLoading plugin -> ${authLoading.value}`);
    }
    user.value = (await authClient.value?.getUser()) || ({} as User);
    isLoggedIn.value = (await authClient.value?.isAuthenticated()) || false;
    if (isLoggedIn.value === true && user.value) {
      token.value = (await authClient.value?.getTokenSilently()) || '';
      user.value.token = token.value;
      _user = user.value;
      return _user;
    }
  }
}
function atob(data: string) {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}
function b64Padding(part: string) {
  part = part.replace(/_/g, '/').replace(/-/g, '+');
  switch (part.length % 4) {
    case 0:
      break;
    case 2:
      part += '==';
      break;
    case 3:
      part += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  return part;
}

const validateSession = async (
  sessionToken: string,
  expiry: number,
): Promise<[boolean, string]> => {
  const tokenExpirationTime = expiry; // token expires in 1 hour (in seconds)

  const [token, timestamp, rawSignature] = sessionToken.split('.');
  const payload = `${token}.${timestamp}`;

  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log('validateSession.1.token', token);
    console.log('validateSession.1.timestamp', timestamp);
    console.log('validateSession.1.rawSignature', rawSignature);
    console.log('validateSession.1.payload', payload);
  }
  const encoder = new TextEncoder();
  const secret = process.env.__SECRET__;
  // const secret = import.meta.env.__SECRET__;
  const secretKeyData = encoder.encode(secret);

  const encoded = encoder.encode(payload.replace(/-/g, '+').replace(/_/g, '/'));
  // const signature = atob(rawSignature);
  const signature = Buffer.from(b64Padding(rawSignature), 'base64');

  let out: [boolean, string] = [false, ''];
  try {
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureIsValid = await crypto.subtle.verify(
      'HMAC',
      secretKey,
      signature,
      encoded,
    );
    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);
    const tokenExpired = tokenAge > tokenExpirationTime * 1000;
    const valid = signatureIsValid && !tokenExpired;
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log('validateSession.2.now', now);
      console.log('validateSession.2.tokenAge', tokenAge);
      console.log('validateSession.2.tokenExpired', tokenExpired);
      console.log('validateSession.2.signatureIsValid', signatureIsValid);
      console.log('validateSession.2.valid', valid);
    }
    out = [valid, token];
  } catch (error) {
    console.log('validateSession.error', error);
  }
  return out;
};

const setSession = async (user: User): Promise<SetSessionResult> => {
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    let logObj = escapeNestedKeys({ ...user }, [
      'token',
      'body',
      'Authorization',
    ]);
    console.log(`setSession.user: ${JSON.stringify(logObj, null, 2)}`);
  }
  const options = { user };

  let res: SetSessionResult = {
    session: undefined,
    status: 'Loading',
  };
  const { data, error, dataLoading } = await useFetch<{ session: Session }>(
    'api/auth/session',
    options,
  );

  while (dataLoading.value && !error.value) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (error.value) {
    if (import.meta.env.VITE_LOG_LEVEL === 'debug')
      console.error(`error: ${error.value}`);
    res = {
      session: undefined,
      status: 'Error',
    };
  }

  if (data.value && data.value.session) {
    console.log('data.value.session. HAS', !!data.value.session);
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      let logObj = escapeNestedKeys({ ...data.value }, [
        'token',
        'body',
        'Authorization',
        'accessToken',
        'sessionToken',
      ]);
      console.log('test');
      console.log(`data: ${JSON.stringify(logObj, null, 2)}`);
    }
    console.log('data.value.sessionToken', data.value);
    const [isValid, token] = await validateSession(
      data.value.session.sessionToken,
      SESSION_TOKEN_EXPIRY,
    );
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_SESSION_TOKEN]);
    // cookie options must be in both set and remove
    if (!isValid) {
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.error(`error token invalid: ${token.substring(0, 10)}`);
      }
      cookies.remove(COOKIES_SESSION_TOKEN, cookieOptions('remove'));
      res = {
        session: undefined,
        status: 'Invalid',
      };
    } else {
      session.value = data.value.session;

      cookies.remove(COOKIES_USER_TOKEN, cookieOptions('remove'));
      cookies.set(COOKIES_USER_TOKEN, true, cookieOptions('set'));

      cookies.remove(COOKIES_SESSION_TOKEN, cookieOptions('remove'));
      cookies.set(COOKIES_SESSION_TOKEN, session.value.sessionToken, {
        ...cookieOptions('set'),
        maxAge: SESSION_TOKEN_EXPIRY,
      });

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        let logObj = escapeNestedKeys({ ...session.value }, [
          'token',
          'accessToken',
          'sessionToken',
        ]);
        console.log('setSession: ', COOKIES_SESSION_TOKEN);
        console.log(JSON.stringify(logObj, null, 2));
        console.log('setSession.cookies: ', cookies.getAll());
        console.log('setSession.cookies: ', cookies.get(COOKIES_SESSION_TOKEN));
      }
      res = { session: session.value, status: 'Success' };
    }
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
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log(`handleRedirectCallback: appState: ${appState}`);
    }
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
    user.value = (await authClient.value?.getUser()) || ({} as User);
    isLoggedIn.value = (await authClient.value?.isAuthenticated()) || false;
    token.value = await authClient.value?.getTokenSilently();
    if (user.value) {
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('loginWithPopup: user: ', user.value);
      }
      user.value.token = token.value || '';
      const seshRes = await setSession(user.value);
      if (seshRes.status === 'Success') {
        if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
          console.log('loginWithPopup: setSession: ', seshRes);
        }
        session.value = seshRes.session;
        // TODO figure out why this doesn't work like it does in loginWithPopup
        window.location.reload();
      }
    }
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
    if (user.value) {
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('loginWithPopup: user: ', user.value);
      }
      user.value.token = token.value || '';
      const seshRes = await setSession(user.value);
      if (seshRes.status === 'Success') {
        if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
          console.log('loginWithPopup: setSession: ', seshRes);
        }
        session.value = seshRes.session;
        window.location.reload();
      }
    }
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
