import { PageContextBuiltIn } from 'vite-plugin-ssr';
import { navigate } from 'vite-plugin-ssr/client/router';
import { resolveRoute } from 'vite-plugin-ssr/routing';

import { PageContext } from '~/../types';

export default (pageContext: PageContext) => {
  if (!pageContext.session?.user) {
    console.log('debug.page.route.ts: user is not logged in');
    // DO NOT do this it creates a vicious endless loop
    // navigate('/auth/login');
    // JUST DON"T
    return {
      pageContext: {
        redirectTo: '/auth/login',
      },
    };
  }
  return resolveRoute('/api-data/debug', pageContext.urlPathname);
};

// export default (pageContext: PageContext) => {
//   // console.log('debug.page.route.ts');
//   // console.log(`is logged in ${userIsLoggedIn(pageContext)}`);
//   // console.log(pageContext.user);
//   // Only render the login page to unauthenticated users
//   if (userIsLoggedIn(pageContext)) {
//     console.log('debug.page.route.ts: user is logged in');
//     return resolveRoute('/api-data/debug', pageContext.urlPathname);
//     return {
//       match: '/debug',
//       // We use a high precedence number of `99` to override all other routes.
//       // This means that unauthenticated users always see the login page,
//       // regardless of the URL.
//       precedence: 99,
//     };

//     // return true;

//     return {
//       // We use a high precedence number of `99` to override all other routes.
//       // This means that unauthenticated users always see the login page,
//       // regardless of the URL.
//       precedence: 99,
//     };
//     return true;
//   } else {
//     console.log('debug.page.route.ts: user is NOT logged in');
//     console.log(pageContext.urlPathname);
//     console.log(resolveRoute('/auth/login', pageContext.urlPathname));

//     // return resolveRoute('/auth/login', pageContext.urlPathname);
//     return {
//       match: true,
//       route: '/auth/login',
//       // routeParams: {
//       //   route: '/auth/login',
//       // },
//       // We use a high precedence number of `99` to override all other routes.
//       // This means that unauthenticated users always see the login page,
//       // regardless of the URL.
//       precedence: 99,
//     };

//     // return true;

//     return {
//       // We use a high precedence number of `99` to override all other routes.
//       // This means that unauthenticated users always see the login page,
//       // regardless of the URL.
//       precedence: 99,
//     };
//     return true;
//   }
// };

function userIsLoggedIn(pageContext: PageContext) {
  // console.log('userIsLoggedIn');
  // console.log(pageContext.user);
  // return true;
  return (
    pageContext.session?.user !== null &&
    pageContext.session?.user !== undefined
  );
}
