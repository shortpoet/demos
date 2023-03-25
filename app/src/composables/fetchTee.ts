import { escapeNestedKeys, safeInit } from '~/../util';
import { Ref, ref, watch } from 'vue';
import { User } from '~/types';

export { useFetchTee };

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
  },
  redirect: 'follow',
  // referrerPolicy: 'no-referrer',
  // cache: 'no-cache',
  // credentials: 'same-origin',
  // mode: 'cors',
};

const useFetchTee = async <T extends unknown>(
  path: string,
  options: RequestConfig | null,
  // valueRef: Ref<T> = <Ref<T>>ref(),
  // loadingRef: Ref<boolean> = ref(false),
  // errorRef: Ref<any> = ref(null),
) => {
  const urlBase = `${import.meta.env.VITE_APP_URL}`;
  const url = `${urlBase}/${path}`;

  const dataLoading = ref(true);
  const error = ref(null);
  const data: Ref<T | any | unknown> = ref();
  if (options === null) {
    options = {};
  }
  console.info(`fetch.fetching data from: -> ${url}`);

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

  const fetchApi = async () => {
    dataLoading.value = true;
    error.value = null;

    try {
      const request = new Request(url, init);

      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        let logObj = escapeNestedKeys({ ...init }, [
          'token',
          'body',
          'Authorization',
        ]);
        console.info(
          `fetching data with init: -> ${JSON.stringify(logObj, null, 2)}`,
        );
        console.log('request', request);
      }

      const response = await fetch(request, {
        ...init,
      });
      if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.log('response', response);
      }
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
  };

  await fetchApi();

  return { fetchApi, data, dataLoading, error };
};
