export { redirectToHttps, isAssetURL, isAPiURL, isJsonURL, isSSR };

const redirectToHttps = (url: URL) =>
  url.protocol === "http:" &&
  url.hostname !== "127.0.0.1" &&
  url.hostname !== "localhost" &&
  !url.hostname.startsWith("192.168.1");

const isAssetURL = (url: URL) => url.pathname.startsWith("/assets/");

const isAPiURL = (url: URL) => url.pathname.startsWith("/api/");

const isJsonURL = (url: URL) => url.pathname.endsWith(".json");

const isSSR = (url: URL) => url.pathname.startsWith("/");
