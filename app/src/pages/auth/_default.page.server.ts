import { PageContext } from '~/../types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const user = pageContext.session?.user;
  console.log('\nauth.server.onBeforeRender - > user');
  console.log(user?.sub);
  console.log(
    `auth.server.is logged in ${user !== null && user !== undefined}`,
  );
  const redirectTo = user ? '/' : undefined;
  console.log(`api-data.server.redirectTo: ${redirectTo}\n`);

  return {
    pageContext: {
      redirectTo,
    },
  };
}
