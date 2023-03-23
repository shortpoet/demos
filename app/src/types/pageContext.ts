export type Component = any;
// // The `pageContext` that are available in both on the server-side and browser-side
// export type PageContext = {
//   Page: Component;
//   pageProps: Record<string, unknown>;
//   exports: {
//     documentProps?: {
//       title: string;
//     };
//   };
//   documentProps?: {
//     title: string;
//   };
// };

export type { PageContextServer };
export type { PageContextClient };
export type { PageContext };
export type { PageProps };

import type { PageContextBuiltIn } from 'vite-plugin-ssr';
// import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router' // When using Client Routing
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client'; // When using Server Routing
import { HttpResponse } from 'vite-plugin-ssr/dist/cjs/node/runtime/renderPage/createHttpResponseObject';
import type { ComponentPublicInstance } from 'vue';
import { User } from '.';

type Page = ComponentPublicInstance; // https://stackoverflow.com/questions/63985658/how-to-type-vue-instance-out-of-definecomponent-in-vue-3/63986086#63986086
type PageProps = {};

export type PageContextCustom = {
  Page: Page;
  pageProps?: PageProps;
  urlPathname: string;
  exports: {
    documentProps?: {
      title?: string;
      description?: string;
    };
  };
  httpResponse: HttpResponse;
  _allPageIds: string[];
  user: User | null;
};

type PageContextServer = PageContextBuiltIn<Page> & PageContextCustom;
type PageContextClient = PageContextBuiltInClient<Page> & PageContextCustom;

type PageContext = PageContextClient | PageContextServer;
