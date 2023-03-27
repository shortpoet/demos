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
  Session,
  AuthUser,
  GithubUser,
  User,
  ClientOptions,
  Auth0Instance,
  Auth0Client,
};

import { Commit } from 'git-last-commit';

type Session = {
  id: string;
  userId: string;
  user: User;
  expires: Date;
  sessionToken: string;
  accessToken: string;
  created: Date;
  updated: Date;
};

type AuthUser = {
  id: string;
  sub: string;
  name: string;
  role: string;
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

export type HealthCheck = {
  status: string;
  version: string;
  uptime: string;
  env: string;
  timestamp: Date;
  gitInfo: Commit;
};

export interface Image {
  id: string;
  title: string;
  url: string;
}

export interface Joke {
  id: string;
  message: string;
  tags: string[];
}

export type Key = {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
  x5c: string[];
  x5t: string;
};

export type WellKnownResponse = {
  keys: Key[];
};

export interface ValidateJWT {
  valid: boolean;
  payload?: Jwt['payload'] | { error: string };
  status: number;
}

export interface Jwt {
  header: any;
  payload: any;
  signature: any;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

export interface RequestOptions {
  method: string;
  headers: Headers;
  body?: string;
}

export interface ResponseOptions extends ResponseInit {
  status: number;
  headers: Headers;
  body?: string;
}

export interface BodyContext {
  user: User;
  data: any;
}

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
