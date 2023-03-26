import { AssetManifestType } from '@cloudflare/kv-asset-handler/dist/types';

declare const DEMO_CFW_SSR: KVNamespace;
declare const __STATIC_CONTENT: KVNamespace;
declare const __STATIC_CONTENT_MANIFEST: AssetManifestType;
declare const ENVIRONMENT: string;

interface Env {
  DEMO_CFW_SSR: KVNamespace;
  DEMO_CFW_SSR_SESSIONS: KVNamespace;
  DEMO_CFW_SSR_USERS: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: AssetManifestType;
  ENVIRONMENT: 'dev' | 'prod';
  __SECRET__: string;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_REDIRECT_URI: string;
  AUTH0_URI: string;
  ALLOWED_ORIGINS:
    | 'https://cloudflare-workers-vue-dev.shortpoet.workers.dev'
    | 'https://cloudflare-workers-vue.shortpoet.workers.dev'
    | 'https://ssr-dev.shortpoet.com'
    | 'https://ssr.shortpoet.com';
  LOG_LEVEL: LogLevel;
  CACHE_TTL: number;

  // MY_DURABLE_OBJECT: DurableObjectNamespace
  // MY_BUCKET: R2Bucket
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
