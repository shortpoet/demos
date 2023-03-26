import { PageContext } from '~/../types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const redirectTo = undefined;
  return {
    pageContext: {
      redirectTo,
    },
  };
}
