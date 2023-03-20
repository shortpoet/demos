import mockDate from 'mockdate';
import { ExecutionContext, FetchEvent } from '@cloudflare/workers-types';
import { beforeEach, vitest, it, describe, expect, vi } from 'vitest';

import { default as workerFetch } from '../worker';
import { Env } from 'app/worker/types';

const STATIC_DATE = new Date('2000-01-01');

const fetchMock = vi.fn();

const cachesMock = {
  match: vi.fn(),
  put: vi.fn(),
};

// @ts-ignore
global.caches = { default: cachesMock };
global.fetch = fetchMock;

const mockCtx = () =>
  ({
    waitUntil: vi.fn(),
  } as unknown as ExecutionContext);

const mockEnv = () =>
  ({
    LOG_LEVEL: 'debug',
  } as Env);

const mockFetchEvent = () => {
  const env = mockEnv();
  const ctx = mockCtx();

  return {
    env,
    ctx,
  };
};

const deferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

beforeEach(() => {
  mockDate.set(STATIC_DATE);
  cachesMock.match.mockReset();
  cachesMock.put.mockReset();
  global.fetch = fetchMock.mockReset();
});

describe('worker', () => {
  describe('basics', () => {
    describe('first request', () => {
      let cachesPutCall: [Request, Response];
      let response: Response;
      let request: Request;
      let env: Env;

      beforeEach(async () => {
        request = new Request('https://example.com');

        fetchMock.mockResolvedValue(
          new Response('', {
            headers: {},
          }),
        );

        response = await workerFetch.fetch(request, mockEnv(), mockCtx());
      });

      it('calls fetch as expected', () => {
        const [request] = fetchMock.mock.calls[0];

        expect(fetchMock).toHaveBeenCalledTimes(1);

        expect(request.url).toBe(`https://example.com/`);
      });

      // it('has the expected cache-control header', () => {
      //   expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
      //     'public, max-age=0, must-revalidate',
      //   );
      // });

      // it('caches the response', () => {
      //   const [request, response] = cachesMock.put.mock.calls[0];

      //   expect(cachesMock.put).toHaveBeenCalledTimes(1);
      //   expect(request.url).toBe('https://example.com/');

      //   // caches forever until revalidate
      //   expect(response.headers.get('cache-control')).toBe('immutable');
      // });

      // describe('… then second request (immediate)', () => {
      //   let response: Response;

      //   beforeEach(async () => {
      //     request = new Request('https://example.com');

      //     cachesMock.match.mockResolvedValueOnce(cachesPutCall[1]);

      //     response = (await swr({
      //       request,
      //       event: mockFetchEvent(),
      //     })) as unknown as Response;
      //   });

      //   it('returns the expected cached response', () => {
      //     expect(response.headers.get('x-edge-cache-status')).toBe('HIT');
      //   });

      //   it('has the expected cache-control header', () => {
      //     expect(response.headers.get('cache-control')).toBe(
      //       'public, max-age=0, must-revalidate',
      //     );
      //   });
      // });

      // describe('… then second request (+7 days)', () => {
      //   let response: Response;

      //   beforeEach(async () => {
      //     request = new Request('https://example.com');

      //     // mock clock forward 7 days
      //     mockDate.set(
      //       new Date(STATIC_DATE.getTime() + 1000 * 60 * 60 * 24 * 7),
      //     );

      //     cachesMock.match.mockResolvedValueOnce(cachesPutCall[1]);

      //     response = (await swr({
      //       request,
      //       event: mockFetchEvent(),
      //     })) as unknown as Response;
      //   });

      //   it('returns the expected cached response', () => {
      //     expect(response.headers.get('x-edge-cache-status')).toBe(
      //       'REVALIDATING',
      //     );
      //   });
      // });
    });
  });
});
