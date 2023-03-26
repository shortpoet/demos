import type { PageContextBuiltIn } from 'vite-plugin-ssr';
import { navigate } from 'vite-plugin-ssr/client/router';
import { PageContext } from '~/../types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const user = pageContext.session?.user;
  console.log('onBeforeRender - > user');
  console.log(user?.sub);
  console.log(`is logged in ${user !== null && user !== undefined}`);
  console.log(`redirectTo: ${user ? '/' : undefined}`);

  return {
    pageContext: {
      redirectTo: user ? '/' : undefined,
    },
  };
}

// async function onBeforeRender(pageContext: PageContext) {
//   const { urlPathname } = pageContext;
//   if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
//     console.log(`api-data.onBeforeRender: urlPathname: ${urlPathname}}`);
//   }
//   if (!userIsLoggedIn(pageContext)) {
//     console.log('api-data.onBeforeRender user is not logged in');
//     // this fires twice, and first is not true then it is so it navigates before user is registered
//     // navigate('/auth/login');
//     // return {
//     //   pageContext: {
//     //     redirectTo: '/auth/login',
//     //   },
//     // };
//   }
//   console.log('api-data.onBeforeRender user is logged in');
//   return {
//     pageContext: {
//       pageProps: {
//         urlPathname,
//       },
//     },
//   };
// }

// function userIsLoggedIn(pageContext: PageContext) {
//   // console.log('userIsLoggedIn');
//   // console.log(pageContext.user);
//   // return true;
//   return (
//     pageContext.session?.user !== null &&
//     pageContext.session?.user !== undefined
//   );
// }
