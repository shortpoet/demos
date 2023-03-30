import GitHub from '@auth/core/providers/github';

import { AuthConfig } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { Provider } from '@auth/core/providers';
import { Env } from 'types';

const authConfig = (env: Env): AuthConfig => {
  console.log(`create auth handler`);
  return {
    providers: [
      GitHub({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      }),
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
        // @ts-expect-error
        // TODO fix this
        async authorize({ email, password }, request) {
          let options = {};
          options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          };
          options = {};
          return {
            id: '1',
            email: email,
          };
          try {
            const response = await fetch(request, options);
            if (!response.ok) return null;
            return (await response.json()) ?? null;
          } catch (error) {
            console.error(error);
            return null;
          }
        },
      }) as Provider,
    ],
    trustHost: true,
    secret: env.NEXTAUTH_SECRET,
  };
};

// const request = new Request('https://example.com');

export default authConfig;
