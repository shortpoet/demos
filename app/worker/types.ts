import { AssetManifestType } from '@cloudflare/kv-asset-handler/dist/types';

declare const DEMO_CFW_SSR: KVNamespace;
declare const __STATIC_CONTENT: KVNamespace;
declare const __STATIC_CONTENT_MANIFEST: AssetManifestType;
declare const ENVIRONMENT: string;

interface Env {
  // APP
  LOG_LEVEL: LogLevel;
  ENVIRONMENT: 'dev' | 'prod';
  SSR_BASE_PATHS: string;

  // CORS
  ALLOWED_ORIGINS:
    | 'https://cloudflare-workers-vue-dev.shortpoet.workers.dev'
    | 'https://cloudflare-workers-vue.shortpoet.workers.dev'
    | 'https://ssr-dev.shortpoet.com'
    | 'https://ssr.shortpoet.com';
  CACHE_TTL: number;

  // CLOUDFLARE
  DEMO_CFW_SSR: KVNamespace;
  DEMO_CFW_SSR_SESSIONS: KVNamespace;
  DEMO_CFW_SSR_USERS: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: AssetManifestType;
  // MY_DURABLE_OBJECT: DurableObjectNamespace
  // MY_BUCKET: R2Bucket
  // MY_QUEUE: R2Queue
  // MY_CACHE: R2Cache
  // MY_DATABASE: R2Database // D1

  // AUTH
  // AUTH COMMON
  ADMIN_USERS: string;
  __SECRET__: string;

  // AUTH0
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_REDIRECT_URI: string;

  // NEXT AUTH
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  // NEXTAUTH_DATABASE_URL: string;

  // GITHUB
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

declare type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LOVELS: readonly LogLevel[] = [
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
];

export {
  Env,
  DEMO_CFW_SSR,
  __STATIC_CONTENT,
  __STATIC_CONTENT_MANIFEST,
  ENVIRONMENT,
  LogLevel,
  LOG_LOVELS,
};
