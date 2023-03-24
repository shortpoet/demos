export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      ENVIRONMENT: 'dev' | 'prod';
      __SECRET__: string;
    }
  }
}

declare module '__STATIC_CONTENT_MANIFEST' {
  const content: string;
  export default content;
}
