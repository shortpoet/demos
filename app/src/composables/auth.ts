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
import { useFetchTee } from './fetchTee';
import { usePageContext } from '~/renderer/usePageContext';

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
  createAuthClient: (options: ClientOptions) => Promise<void>;
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
const authClient = ref<Auth0Client>({} as Auth0Client);

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

const audience = `https://ssr.shortpoet.com`;

async function createAuthClient(options: ClientOptions) {
  // console.log('createAuthClient');
  const initOptions: ClientOptions = {
    ...options,
    domain: options.domain,
    clientId: options.clientId,
    authorizationParams: {
      scope: 'openid profile email',
      audience,
      redirect_uri: import.meta.env.VITE_AUTH0_CALLBACK_URL,
      response_type: 'code',
    },
  };
  authClient.value = await createAuth0Client(initOptions);
  if (!authClient.value) {
    throw new Error('Auth0 client not initialized');
  }
}

async function onLoad(onRedirectCallback = DEFAULT_REDIRECT_CALLBACK) {
  try {
    const { useCookies } = await import('@vueuse/integrations/useCookies');
    const cookies = useCookies([COOKIES_USER_TOKEN]);
    const hasToken = cookies.get(COOKIES_USER_TOKEN);
    console.log(`auth hasToken and bool: ${[hasToken, hasToken === true]}`);
    if (
      window.location.search.includes('code=') &&
      window.location.search.includes('state=')
    ) {
      const res = await authClient.value.handleRedirectCallback();
      onRedirectCallback(res.appState);
    } else if (hasToken === true) {
      const tokenRes = await authClient.value.getTokenSilently({
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
    user.value = await authClient.value.getUser();
    isLoggedIn.value = await authClient.value.isAuthenticated();
    if (isLoggedIn.value === true && user.value) {
      token.value = await authClient.value.getTokenSilently();
      user.value.token = token.value;
      const seshRes = await setSession(user.value);
      // pageContext.user = user.value;
      if (seshRes && seshRes !== 'Ok') {
        console.error(`seshRes: ${seshRes}`);
      }
    }
  }
}
// const pageContext = usePageContext();
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

const useAuth = async (
  {
    onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
    redirect_uri = import.meta.env.VITE_AUTH0_CALLBACK_URL,
    ...options
  }: ClientOptions = { ...defaultOptions },
): Promise<Auth0Instance> => {
  // if (instance) return instance;
  // console.log("useAuth");

  await createAuthClient(options);
  await onLoad(onRedirectCallback);

  async function _getTokenSilently(
    options?: GetTokenSilentlyOptions,
  ): Promise<string>;
  async function _getTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true },
  ): Promise<GetTokenSilentlyVerboseResponse>;
  async function _getTokenSilently(options?: any): Promise<any> {
    if (options?.detailedResponse) {
      return await authClient.value.getTokenSilently({
        ...options,
        detailedResponse: true,
      });
    } else {
      return await authClient.value.getTokenSilently(options);
    }
  }

  return {
    user,
    authLoading,
    popupOpen,
    isLoggedIn,
    authError: error,
    createAuthClient: createAuthClient,
    onLoad: onLoad,
    handleRedirectCallback: async () => {
      console.log('handleRedirectCallback');
      authLoading.value = true;
      try {
        const { appState } = await authClient.value.handleRedirectCallback();
        console.log(`handleRedirectCallback: appState: ${appState}`);
        user.value = await authClient.value.getUser();
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
      const authenticated = await authClient.value.isAuthenticated();
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
        const res = await authClient.value.loginWithRedirect(o);
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
        const res = await authClient.value.loginWithPopup(o);
        return res;
      } catch (e) {
        console.error(e);
        error.value = e;
        authLoading.value = false;
      } finally {
        popupOpen.value = false;
        user.value = await authClient.value.getUser();
        isLoggedIn.value = await authClient.value.isAuthenticated();
        token.value = await authClient.value.getTokenSilently();
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
      await authClient.value.logout(o);
      user.value = undefined;
      isLoggedIn.value = false;
    },
    getTokenSilently: _getTokenSilently,
  };
};
