import { PageContext } from '~/../types';
// import AuthLayout from '~/layouts/AuthLayout.vue';
// import AdminLayout from '~/layouts/AdminLayout.vue';

export { onBeforeRender };

import AuthLayout from '~/layouts/AuthLayout.vue';
import AdminLayout from '~/layouts/AdminLayout.vue';
let Layout = AuthLayout;
export { Layout };

async function onBeforeRender(
  pageContext: PageContext,
): Promise<{ pageContext: Partial<PageContext> }> {
  const user = pageContext.session?.user;
  const path = pageContext.urlPathname;

  // overrides renderer/_default.page.server.ts
  const protectedRoutes = ['/api-data/debug'];

  let redirectTo = undefined;
  if (protectedRoutes.includes(path) && !user) {
    redirectTo = user ? undefined : '/auth/login';
  }
  let Layout = pageContext.pageProps?.isAdmin ? AdminLayout : AuthLayout;
  return {
    pageContext: {
      redirectTo,
      pageProps: {
        isAdmin: user?.role === 'admin',
      },
      Layout,
    },
  };
}
