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
      // APP
      NODE_ENV: 'development' | 'production';
      ENVIRONMENT: 'dev' | 'prod';
      VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent';
      VITE_PORT: string;
      VITE_APP_NAME: string;
      VITE_APP_URL: string;

      // CORS
      ALLOWED_ORIGINS:
        | 'https://cloudflare-workers-vue-dev.shortpoet.workers.dev'
        | 'https://cloudflare-workers-vue.shortpoet.workers.dev'
        | 'https://ssr-dev.shortpoet.com'
        | 'https://ssr.shortpoet.com';
      CACHE_TTL: number;

      // AUTH
      // AUTH COMMON
      __SECRET__: string;

      // AUTH0
      VITE_AUTH0_DOMAIN: string;
      VITE_AUTH0_CLIENT_ID: string;
      VITE_AUTH0_CALLBACK_URL: string;

      // NEXT AUTH
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
    }
  }
}
declare global {
  const AUTH0_DOMAIN: string;
  const AUTH0_CLIENT_ID: string;
  const AUTH0_REDIRECT_URI: string;
  const AUTH0_URI: string;
}
