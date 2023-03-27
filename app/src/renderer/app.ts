import { createSSRApp, defineComponent, h, markRaw, reactive } from 'vue';
import PageShell from '~/layouts/PageShell.vue';

import { setPageContext } from '~/composables/pageContext';
import { createHead } from '@vueuse/head';
import { Component, PageContext } from 'app/types/pageContext';
import '@unocss/reset/tailwind.css';
import 'uno.css';
import '~/styles/main.css';
import { provideAuth } from '~/composables/auth-plugin';

export { createApp };

function createApp(pageContext: PageContext) {
  // console.log('createApp');
  const { Page, pageProps, session, csrfToken, callbackUrl } = pageContext;
  const isAdmin = pageProps?.isAdmin;
  let rootComponent: Component;

  const PageWithWrapper = defineComponent({
    data: () => ({
      Page: markRaw(Page),
      pageProps: markRaw(pageProps || {}),
      Layout: markRaw(pageContext.exports.Layout || PageShell),
      session,
      csrfToken,
      callbackUrl,
    }),
    created() {
      rootComponent = this;
      provideAuth();
    },
    render() {
      return h(
        this.Layout,
        {},
        {
          default: () => {
            return h(this.Page, this.pageProps);
          },
        },
      );
    },
  });

  const app = createSSRApp(PageWithWrapper);
  // We use `app.changePage()` to do Client Routing, see `_default.page.client.js`
  objectAssign(app, {
    changePage: (pageContext: PageContext) => {
      Object.assign(pageContextReactive, pageContext);
      rootComponent.Page = markRaw(pageContext.Page);
      rootComponent.pageProps = markRaw(pageContext.pageProps || {});
      // without the below line the layout only changes on reload, and then persists weirdly to other navigated pages
      rootComponent.Layout = markRaw(pageContext.exports.Layout || PageShell);
      rootComponent.session = pageContext.session;
      rootComponent.csrfToken = pageContext.csrfToken;
      rootComponent.callbackUrl = pageContext.callbackUrl;
    },
  });

  // When doing Client Routing, we mutate pageContext (see usage of `app.changePage()` in `_default.page.client.js`).
  // We therefore use a reactive pageContext.
  const pageContextReactive = reactive(pageContext);

  // Make `pageContext` accessible from any Vue component
  setPageContext(app, pageContextReactive);

  app.use(createHead());

  return app;
}

// Same as `Object.assign()` but with type inference
function objectAssign<Obj, ObjAddendum>(
  obj: Obj,
  objAddendum: ObjAddendum,
): asserts obj is Obj & ObjAddendum {
  Object.assign(obj, objAddendum);
}
