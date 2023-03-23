import { PageContextBuiltIn } from 'vite-plugin-ssr';
import { PageContext } from '~/types';

export default (pageContext: PageContext) => {
  console.log('debug.page.route.ts');
  console.log(`is logged in ${userIsLoggedIn(pageContext)}`);
  console.log(pageContext.user);
  // Only render the login page to unauthenticated users
  if (!userIsLoggedIn(pageContext)) {
    return false;
  }

  return true;

  // return {
  //   // We use a high precedence number of `99` to override all other routes.
  //   // This means that unauthenticated users always see the login page,
  //   // regardless of the URL.
  //   precedence: 99,
  // };
};

function userIsLoggedIn(pageContext: PageContext) {
  // console.log('userIsLoggedIn');
  // console.log(pageContext.user);
  // return true;
  return pageContext.user !== null && pageContext.user !== undefined;
}
