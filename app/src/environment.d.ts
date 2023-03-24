declare interface Window {
  auth0: Auth0Client;
  webAuth: any;
  webAuthPasswordless: any;
  Cookies: any;
}

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      ENVIRONMENT: 'dev' | 'prod';
      AUTH0_DOMAIN: string;
      AUTH0_CLIENT_ID: string;
      AUTH0_REDIRECT_URI: string;
      AUTH0_URI: string;
      VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent';
      __SECRET__: string;
      ALLOWED_ORIGINS:
        | 'https://cloudflare-workers-vue-dev.shortpoet.workers.dev'
        | 'https://cloudflare-workers-vue.shortpoet.workers.dev'
        | 'https://ssr-dev.shortpoet.com'
        | 'https://ssr.shortpoet.com';
      CACHE_TTL: number;
    }
  }
}
declare global {
  const AUTH0_DOMAIN: string;
  const AUTH0_CLIENT_ID: string;
  const AUTH0_REDIRECT_URI: string;
  const AUTH0_URI: string;
}
