import { PageContext } from '~/../types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const user = pageContext.session?.user;
  const path = pageContext.urlPathname;

  // overrides renderer/_default.page.server.ts
  const protectedRoutes = ['/api-data/debug'];

  let redirectTo = undefined;
  if (protectedRoutes.includes(path) && !user) {
    redirectTo = user ? undefined : '/auth/login';
  }
  return {
    pageContext: {
      redirectTo,
    },
  };
}
