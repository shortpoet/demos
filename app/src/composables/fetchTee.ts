import { Ref, ref, watch } from 'vue';

export { useFetchTee };

export interface RequestConfig {
  // Default options are marked with *
  method?: string; // *GET, POST, PUT, DELETE, PATCH, OPTIONS.
  headers?: Record<string, string>; // *default, no-cache, reload, force-cache, only-if-cached
  body?: string; // body data type must match "Content-Type" header
  redirect?: RequestRedirect; // manual, *follow, error
  token?: string;
  withAuth?: boolean;
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
  options: RequestConfig = {},
  valueRef: Ref<T> = <Ref<T>>ref(),
  loadingRef: Ref<boolean> = ref(false),
  errorRef: Ref<any> = ref(null),
) => {
  const urlBase = `${import.meta.env.VITE_APP_URL}`;
  const url = `${urlBase}/${path}`;

  const isLoading = ref(false);
  const error = ref(null);
  const data: Ref<any> = ref();
  // empty token ?
  const token = ref();
  // possible leak of private data

  let headers;

  options.token = token.value;
  headers = {
    ...options.headers,
    Authorization: `Bearer ${options.token}`,
    // "X-Ping": "pong",
  };
  options = { ...options, headers };

  // if (options.withAuth) {
  //   if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
  //     console.log('fetchTee.withAuth.options', options);
  //   }
  //   // part of the issue is
  //   //  surviving refresh
  //   //  silently reverifying without refresh?
  //   // if (!authStore.isLoggedIn) {
  //   //   throw new Error("Not logged in");
  //   // }

  //   options.token = token.value;
  //   headers = {
  //     ...options.headers,
  //     Authorization: `Bearer ${options.token}`,
  //     // "X-Ping": "pong",
  //   };
  //   options = { ...options, headers };
  // }

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
        `fetching data with init: -> ${JSON.stringify(init, null, 2)}`,
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

  await fetchApi();

  if (error.value) {
    errorRef.value = error.value;
    loadingRef.value = !!isLoading.value;
  } else if (data.value && isLoading.value === false) {
    console.log('useFetch.hasData', {
      data: data.value,
      isLoading: isLoading.value,
    });
    errorRef.value = null;
    valueRef.value = data.value;
    loadingRef.value = !!isLoading.value;
  }

  // valueRef.value = data.value;
  // loadingRef.value = isLoading.value;
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
  return { fetchApi, valueRef, loadingRef, errorRef };
};
