import GitHub from '@auth/core/providers/github';

import { AuthConfig } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { Provider } from '@auth/core/providers';
import { Env } from 'types';

const AuthHandler = (env: Env): AuthConfig => {
  return {
    providers: [
      GitHub({ clientId: '', clientSecret: '' }),
      Credentials({
        name: 'Credentials',
        credentials: {
          email: {
            label: 'Email',
            type: 'text',
            placeholder: 'example@email.com',
          },
          password: {
            label: 'Password',
            type: 'password',
            placeholder: 'supersecret',
          },
        },
        async authorize({ email, password }, request) {
          const response = await fetch(request);
          if (!response.ok) return null;
          return (await response.json()) ?? null;
        },
      }) as Provider,
    ],
    trustHost: true,
    secret: env.JWT_SECRET,
  };
};

// const request = new Request('https://example.com');

export default AuthHandler;
