import { CookieSetOptions } from 'universal-cookie';

export { COOKIES_SESSION_TOKEN, COOKIES_USER_TOKEN, cookieOptions };

const COOKIES_USER_TOKEN = `${import.meta.env.VITE_APP_NAME}-user-token`;
const COOKIES_SESSION_TOKEN = `${import.meta.env.VITE_APP_NAME}-session-token`;
const COOKIE_EXPIRY = 1000 * 60 * 60 * 24;

const cookieOptions: (mode: 'set' | 'remove') => CookieSetOptions = (mode) => {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
  console.log('cookieOptions');
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
    sameSite: isLocalhost ? ('lax' as const) : ('none' as const),
    // below only works in https
    secure: import.meta.env.VITE_APP_URL.startsWith('https'),
    httpOnly: !import.meta.env.VITE_APP_URL.startsWith('https'),
  };
  console.log(out);
  return out;
};
