import { Commit } from 'git-last-commit';

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

export { User };

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
