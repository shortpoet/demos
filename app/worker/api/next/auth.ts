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
import GithubProvider from 'next-auth/providers/github';

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
  secret: process.env.SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  theme: {
    colorScheme: 'light',
  },
  callbacks: {
    async jwt({ token }) {
      token.userRole = 'admin';
      return token;
    },
    // async signIn(user, account, profile) {
    //   return user;
    // },
    // async redirect(url, baseUrl) {
    //   return baseUrl;
    // },
    // async session(session, user) {
    //   return session;
    // },
    // async jwt({ token, user }) {
    //   if (user) {
    //     const status: number = user.get('status', null, { getters: false });
    //     token.status = status;
    //   }
    //   return token;
    // },
    // async session({ session, token }) {
    //   session.user.status = decode(token.status!);
    //   session.user.id = token.sub!;
    //   return session;
    // },
  },
  // events: {},
  // pages: {},
  // jwt: {},
  // debug: false,
};

const handleRequest: RequestHandler = async (req, res, opts) => {
  if (req.method !== 'POST' && req.method !== 'GET') return;
  const action = req.path.split('/').slice(2);
  if (action[0] === 'callback') {
    const sessionToken = await getToken({ req });
    const needsLogin = ['verify-email' /*, 'otp' */].includes(action[1]);
    if (req.method === 'GET') transformGetRequest(req);
    req.body.sessionToken = sessionToken
      ? JSON.stringify(sessionToken)
      : undefined;
    if (needsLogin && !sessionToken) return res.redirect(307, '/login');
    if (!needsLogin && sessionToken)
      return res.status(403).send('Already logged-in');
  }
  req.query.nextauth = action;
  NextAuth(req, res, opts);
};

export default NextAuth(nextAuthOptions);
