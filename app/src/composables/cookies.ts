import { CookieSetOptions } from 'universal-cookie';

export { COOKIES_SESSION_TOKEN, COOKIES_USER_TOKEN, cookieOptions };

const COOKIES_USER_TOKEN = `${import.meta.env.VITE_APP_NAME}-user-token`;
const COOKIES_SESSION_TOKEN = `${import.meta.env.VITE_APP_NAME}-session-token`;
const COOKIE_EXPIRY = 1000 * 60 * 60 * 24;

const cookieOptions: (mode: 'set' | 'remove') => CookieSetOptions = (mode) => {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log('cookieOptions');
  }
  const hostname = new URL(import.meta.env.VITE_APP_URL).hostname;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname.startsWith('127.0.0.') ||
    hostname.startsWith('192.168.');
  const out = {
    path: '/',
    expires: new Date(Date.now() + COOKIE_EXPIRY),
    maxAge: 60 * 60 * 24,
    domain: hostname,
    sameSite: 'none' as const,
    secure: import.meta.env.VITE_APP_URL.startsWith('https') && !isLocalhost,
    httpOnly: false,
  };
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log(out);
  }
  return out;
};
