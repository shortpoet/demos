import GitHub from '@auth/core/providers/github';

import Auth, { type AuthConfig } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { Provider } from '@auth/core/providers';
import { getToken } from '@auth/core/jwt';
import { Env } from 'types';

const authConfig = (env: Env): AuthConfig => {
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
        async authorize(credentials) {
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

const authHandler = (req, res) => NextAuth(req, res, authOptions);

export default authHandler;
