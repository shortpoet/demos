import { Ref, ref } from 'vue';
import { User } from '~/types';

export { useFetch };

export interface RequestConfig {
  // Default options are marked with *
  method?: string; // *GET, POST, PUT, DELETE, PATCH, OPTIONS.
  headers?: Record<string, string>; // *default, no-cache, reload, force-cache, only-if-cached
  body?: string; // body data type must match "Content-Type" header
  redirect?: RequestRedirect; // manual, *follow, error
  token?: string;
  user?: User;
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

const useFetch = async (url: string, options: RequestConfig | null) => {
  const dataLoading = ref(false);
  const error = ref(null);
  const data: Ref<any> = ref();
  if (options === null) {
    options = {};
  }
  console.info(`fetch.fetching data from: -> ${url}`);

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

  const token = ref(options.token || options.user?.token);
  const user = ref(options.user);
  // possible leak of private data

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token.value}`,
    // "X-Ping": "pong",
  };
  options = {
    ...options,
    ...(token.value ? { headers } : {}),
    ...(user.value ? { body: JSON.stringify(user.value) } : {}),
    ...(token.value ? { token: token.value } : {}),
  };
  let init = options.body
    ? {
        ...requestInit,
        ...options,
        method: 'POST',
      }
    : {
        ...requestInit,
        ...options,
        method: 'GET',
      };

  dataLoading.value = true;
  error.value = null;
  const safeInit = (init: any) => ({
    ...init,
    headers: {
      ...init.headers,
      Authorization: init.token
        ? `Bearer ${init.token?.substring(0, 7)}...}`
        : null,
    },
    token: init.token ? init.token?.substring(0, 7) : null,
    user: {
      ...init.user,
      token:
        init.user && init.user.token ? init.user?.token?.substring(0, 7) : null,
    },
    body: init.body ? JSON.stringify(init.body).substring(0, 50) : null,
  });

  try {
    console.info(
      `fetching data with init: -> ${JSON.stringify(safeInit(init), null, 2)}`,
    );
    const request = new Request(url, init);
    console.log(request);
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
      const jClone = await clone.clone().json();
      const msg = (await clone.text()) || 'empty text res';
      console.log('text clone', msg.substring(0, 50));
      console.log('json clone', jClone);
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
    dataLoading.value = false;
  } finally {
    dataLoading.value = false;
  }
  return { dataLoading, error, data };
};
