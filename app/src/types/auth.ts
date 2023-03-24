import {
  Auth0ClientOptions,
  Auth0Client,
  PopupLoginOptions,
  RedirectLoginResult,
  LogoutOptions,
  RedirectLoginOptions,
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
} from '@auth0/auth0-spa-js';
import { Ref } from 'vue';

export {
  AuthUser,
  GithubUser,
  User,
  ClientOptions,
  Auth0Instance,
  Auth0Client,
};

type AuthUser = {
  id: string;
  name: string;
  token: string;
  email?: string;
};

type GithubUser = {
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  sub: string;
  email?: string;
};

type User = AuthUser & GithubUser;

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
  onLoad: () => Promise<User | null | undefined>;
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
