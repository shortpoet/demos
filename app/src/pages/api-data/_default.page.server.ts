import { PageContext } from '~/../types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const user = pageContext.session?.user;
  console.log('\napi-data.server.onBeforeRender - > user');
  console.log(user?.sub);
  console.log(
    `api-data.server.is logged in ${user !== null && user !== undefined}`,
  );
  const redirectTo = user ? '/' : '/auth/login';
  console.log(`api-data.server.redirectTo: ${redirectTo}\n`);

  return {
    pageContext: {
      redirectTo,
    },
  };
}
