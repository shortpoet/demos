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
    'X-Ping': 'pong',
  },
  redirect: 'follow',
  // referrerPolicy: 'no-referrer',
  // cache: 'no-cache',
  // credentials: 'same-origin',
  // mode: 'cors',
};

const useFetchTee = async <T>(
  path: string,
  options: RequestConfig | null,
  // valueRef: Ref<T> = <Ref<T>>ref(),
  // loadingRef: Ref<boolean> = ref(false),
  // errorRef: Ref<any> = ref(null),
) => {
  const urlBase = `${import.meta.env.VITE_APP_URL}`;
  const url = `${urlBase}/${path}`;

  const dataLoading = ref(false);
  const error = ref(null);
  const data: Ref<T | undefined> = ref();
  if (options === null) {
    options = {};
  }
  // empty token ?
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
  const fetchApi = async () => {
    dataLoading.value = true;
    error.value = null;

    try {
      console.info(
        `fetching data with init: -> ${JSON.stringify(
          safeInit(init),
          null,
          2,
        )}`,
      );
      const request = new Request(url, init);
      console.log('request', request);
      const response = await fetch(request, {
        ...init,
        body: JSON.stringify(user.value),
      });
      // console.log('response', response);
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

  // if (error.value) {
  //   errorRef.value = error.value;
  //   loadingRef.value = !!dataLoading.value;
  // } else if (data.value && dataLoading.value === false) {
  //   console.log('useFetch.hasData', {
  //     data: data.value,
  //     dataLoading: dataLoading.value,
  //   });
  //   errorRef.value = null;
  //   valueRef.value = data.value;
  //   loadingRef.value = !!dataLoading.value;
  // }

  // valueRef.value = data.value;
  // loadingRef.value = dataLoading.value;
  // errorRef.value = error.value;

  // watch(
  //   () => [authStore.idToken],
  //   async (cur, prev) => {
  //     console.log(`idToken changed from ${prev} to ${cur}`);
  //     user.value = authStore.currentUser;
  //     isLoggedIn.value = authStore.isLoggedIn;
  //     token.value = authStore.idToken;
  //     await fetchApi();
  //   }
  // );
  return { fetchApi, data, dataLoading, error };
};
