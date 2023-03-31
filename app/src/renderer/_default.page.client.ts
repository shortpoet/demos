import { PageContextBuiltInClient } from "vite-plugin-ssr/client";
import { PageContext } from "app/types/pageContext";
import { createApp } from "./app";
import { usePageTitle } from "../composables/pageTitle";

export const clientRouting = true;
export const prefetchStaticAssets = { when: "VIEWPORT" };
export { render };

let app: Awaited<Promise<PromiseLike<ReturnType<typeof createApp>>>>;
async function render(pageContext: PageContextBuiltInClient & PageContext) {
  if (!app) {
    app = await createApp(pageContext);
    app.mount("#app");
  } else {
    app.changePage(pageContext);
  }
  const { title } = usePageTitle(pageContext);
  document.title = title;
}
