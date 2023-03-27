import NextAuth, {
  NextAuthOptions,
  TokenSet,
  Awaitable,
  User,
  Session,
  AuthOptions,
  DefaultUser,
} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getToken } from 'next-auth/jwt';
import { AuthHandler } from 'next-auth/core';
// import { NextApiRequest, NextApiResponse } from 'next';
// import { Request, Response, NextFunction } from 'express';

type RequestHandler = (
  req: Request,
  res: Response,
  // next: NextFunction,
  opts: NextAuthOptions,
) => any;

const uri = process.env.NEXTAUTH_URL;

if (!uri) {
  throw new Error('Please add your NEXTAUTH_URL to .env');
}

const AuthError = class AuthError extends Error {};

const nextAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      id: 'register',
      credentials: {
        email: {},
        username: {},
        password: {},
        password2: {},
        fullname: {},
        companyname: {},
      },
      async authorize(form = {} as any) {
        // const formErrors = validateRegistrationForm(form)
        // const { email, username: name, password, ...rest } = form
        try {
          // if (Object.keys(formErrors).length) {
          //   throw new AuthError(JSON.stringify(formErrors))
          // }
          // if (await User.exists({ name }).collation({ locale: 'en', strength: 2 })) {
          //   formErrors.username = 'USERNAME_TAKEN'
          //   throw new AuthError(JSON.stringify(formErrors))
          // }
          // if (await User.exists({ email })) {
          //   formErrors.email = 'EMAIL_IN_USE'
          //   throw new AuthError(JSON.stringify(formErrors))
          // }
          // const hashedPassword = await bcrypt.hash(password, 10)
          // const user = await User.create({ email, name, password: hashedPassword, ...rest })
          // try {
          //   await verificationRequest(user.id, user.email)
          // } catch {/* ignore that error */}
          const user: DefaultUser = {
            id: '1',
            name: 'John Doe',
            email: 'test@example.com',
            image: 'https://example.com/image.png',
          };
          return user;
        } catch (err) {
          if (err instanceof AuthError) throw err;
          // formErrors.form = 'SOMETHING_WENT_WRONG';
          throw new Error(JSON.stringify(err));
          // throw new Error(JSON.stringify(formErrors));
        }
      },
    }),
    CredentialsProvider({
      id: 'login',
      credentials: {
        username: {},
        password: {},
      },
      async authorize(form = {} as any) {
        const formErrors = validateLoginForm(form);
        const { username: name, password } = form;
        try {
          if (Object.keys(formErrors).length) {
            throw new AuthError(JSON.stringify(formErrors));
          }
          const user = await User.findOne({ name }).collation({
            locale: 'en',
            strength: 2,
          });
          if (!user) {
            formErrors.username = 'INCORRECT_USERNAME';
            throw new AuthError(JSON.stringify(formErrors));
          }
          if (!(await bcrypt.compare(password, user.password))) {
            formErrors.password = 'INCORRECT_PASSWORD';
            throw new AuthError(JSON.stringify(formErrors));
          }
          return user;
        } catch (err) {
          if (err instanceof AuthError) throw err;
          console.error(err);
          formErrors.form = 'SOMETHING_WENT_WRONG';
          throw new Error(JSON.stringify(formErrors));
        }
      },
    }),
    CredentialsProvider({
      id: 'verify-email',
      credentials: {
        token: {},
        sessionToken: {},
      },
      async authorize(form = {} as any) {
        const token = form.token;
        const sessionToken: JWT = JSON.parse(form.sessionToken);
        const status = decode(sessionToken.status!);
        if (status.EMAIL_VERIFIED) throw new AuthError();
        const isValid = await validateToken(token, sessionToken);
        if (!isValid) throw new AuthError();
        try {
          const user = (await User.findById(sessionToken.sub))!;
          user.status = { EMAIL_VERIFIED: true } as Status;
          await user.save();
          return user;
        } catch {
          throw new AuthError();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const status: number = user.get('status', null, { getters: false });
        token.status = status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.status = decode(token.status!);
      session.user.id = token.sub!;
      return session;
    },
  },
};

export default NextAuth({
  providers: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      version: '2.0',
      scope: 'read:user',
      params: { grant_type: 'authorization_code' },
    },
  ],
  callbacks: {
    async signIn(user, account, profile) {
      return true;
    },
    async redirect(url, baseUrl) {
      return baseUrl;
    },
    async session(session, user) {
      return session;
    },
  },
  events: {},
  pages: {},
  session: {
    jwt: true,
  },
  jwt: {},
  debug: false,
} as unknown as NextAuthOptions);

// import { NextApiRequest, NextApiResponse } from 'next'
// import NextAuth from 'next-auth'
// import Providers from 'next-auth/providers'
//
// const options = {
//   providers: [
//     Providers.GitHub({
//       clientId: process.env.GITHUB_ID,
//       clientSecret: process.env.GITHUB_SECRET
//     })
//   ],
//   callbacks: {
//     async signIn(user, account, profile) { return true },
//     async redirect(url, baseUrl) { return baseUrl },
//     async session(session, user) { return session },
//     async jwt(token, user, account, profile, isNewUser) { return token }
//   },
//   events: {},
//   pages: {},
//   session: {
//     jwt: true
//   },
//   jwt: {},
//   debug: false,
// }
//
// export default (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, options)

// import { NextApiRequest, NextApiResponse } from 'next'
// import NextAuth from 'next-auth'
// import Providers from 'next-auth/providers'
//
// const options = {
//   providers: [
//     Providers.GitHub({
//       clientId: process.env.GITHUB_ID,
//       clientSecret: process.env.GITHUB_SECRET
//     })
//   ],
//   callbacks: {
//     async signIn(user, account, profile) { return true },
//     async redirect(url, baseUrl) { return baseUrl },
//     async session(session, user) { return session },

//     async jwt(token, user, account, profile, isNewUser) {
//       // Add access_token to the token right after signin
//       if (account?.accessToken) {
//         token.accessToken = account.accessToken
//       }
//       return token
//     }
//   },
//   events: {},

//   pages: {},
//   session: {
//     jwt: true
//   },
//   jwt: {},
//   debug: false,
// }
//
