import { Env } from './types';

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

declare module globalThis {
  let process: { env: Env };
}

// declare module 'next-auth' {
//   interface Session {
//     user: DefaultSession['user'] & {
//       id: string;
//       status: Record<keyof typeof STATUS, boolean>;
//     };
//   }
//   interface User extends InstanceType<typeof UserModel> {}
// }

// declare module 'next-auth/jwt' {
//   interface JWT {
//     status?: number;
//   }
// }
