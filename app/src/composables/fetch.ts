import { Ref, ref } from 'vue';

export { useFetch };

export interface RequestConfig {
  // Default options are marked with *
  method?: string; // *GET, POST, PUT, DELETE, PATCH, OPTIONS.
  headers?: Record<string, string>; // *default, no-cache, reload, force-cache, only-if-cached
  body?: string; // body data type must match "Content-Type" header
  redirect?: RequestRedirect; // manual, *follow, error
  token?: string;
  // Cloudflare Error: The 'mode, credentials' field on 'RequestInitializerDict' is not implemented.
  // referrerPolicy?: ReferrerPolicy; // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  // cache?: RequestCache; // *default, no-cache, reload, force-cache, only-if-cached
  // credentials?: RequestCredentials; // include, *same-origin, omit
  // mode?: RequestMode; // no-cors, *cors, same-origin
}

export const requestInit: RequestConfig = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Ping': 'pong',
    // "Access-Control-Request-Method": "GET",
    // "Access-Control-Request-Headers": "Content-Type",
  },
  // redirect: "follow",
  // referrerPolicy: 'no-referrer',
  // cache: 'no-cache',
  // credentials: 'same-origin',
  // mode: 'cors',
};

const useFetch = (url: string, options: RequestConfig = {}) => {
  const isLoading = ref(false);
  const error = ref(null);
  const data: Ref<any> = ref();

  console.info(`fetch.fetching data from: -> ${url}`);

  let headers = {};
  // console.log(
  //   'options',
  //   JSON.stringify(
  //     {
  //       ...options,
  //       headers: {
  //         ...options.headers,
  //         Authorization: `Bearer ${options.token?.substring(0, 7)}...}`,
  //       },
  //       token: `Bearer ${options.token?.substring(0, 7)}...}`,
  //     },
  //     null,
  //     2,
  //   ),
  // );

  if (options.token) {
    headers = {
      // ...requestInit.headers,
      ...options.headers,
      Authorization: `Bearer ${options.token}`,
    };
    options = { ...options, headers };
  } else {
    headers = {
      ...requestInit.headers,
      ...options.headers,
    };
    options = { ...options, headers };
  }

  let init = {
    method: 'GET',
    ...requestInit,
    ...options,
  };

  const fetchApi = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      console.info(
        `fetching data with init: -> ${JSON.stringify(
          {
            ...init,
            headers: {
              ...init.headers,
              Authorization: `Bearer ${options.token?.substring(0, 7)}...}`,
            },
            token: `Bearer ${options.token?.substring(0, 7)}...}`,
          },
          null,
          2,
        )}`,
      );
      const request = new Request(url, init);
      const response = await fetch(request);
      const ct = response.headers.get('Content-Type');
      if (!response.ok) {
        throw new Error(
          JSON.stringify({
            message: `Failed to fetch data from ${url}.`,
            status: response.status,
            statusText: response.statusText,
          }),
        );
      }

      let out;

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('res', JSON.stringify(response, null, 2));
        const clone = await response.clone();
        console.log('text clone', await clone.clone().text());
        console.log('clone', JSON.stringify(clone.json, null, 2));
      }
      ct === 'application/json'
        ? (out = await response.json())
        : (out = { text: await response.text() });

      data.value = out;
    } catch (err: any) {
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('err', err);
      }

      error.value = err;
      // error.value = JSON.parse(err.message);
      isLoading.value = false;
    } finally {
      isLoading.value = false;
    }
  };
  return { fetchApi, isLoading, error, data };
};
