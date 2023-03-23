import { KVNamespace } from '@cloudflare/workers-types';
import { Env } from '../interfaces';

declare const TODOS: KVNamespace;

export { handleRequest };

const withStatus = (status: number = 200, headers?: any) => ({
  status,
  headers: { ...corsHeaders, ...(headers || {}) },
});

async function handleGETRequests(request: Request, token: any) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case '/api/status':
      return new Response(JSON.stringify({ hello: 'world' }), withStatus());

    case '/api/todos': {
      const todos = await TODOS.get(token.sub);

      return new Response(
        todos || '[]',
        withStatus(200, { 'Content-Type': 'application/json' }),
      );
    }
  }

  return new Response(null, withStatus(404));
}

declare type Payload = {
  todo: string;
  index: number;
};

async function handlePOSTRequests(request: Request, token: any) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case '/api/todos': {
      const payload: Payload = await request.json();
      const todos: any = (await TODOS.get(token.sub, 'json')) || [];
      todos.push(payload.todo);
      await TODOS.put(token.sub, JSON.stringify(todos));

      return new Response(null, withStatus(204));
    }
  }

  return new Response(null, withStatus(400));
}

async function handleDELETERequests(request: Request, token: any) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case '/api/todos': {
      const payload: Payload = await request.json();
      const todos: any = (await TODOS.get(token.sub, 'json')) || [];
      const index = payload.index;
      if (todos.length > 0 && index >= 0 && index < todos.length) {
        await TODOS.put(
          token.sub,
          JSON.stringify(todos.slice(0, index).concat(todos.slice(index + 1))),
        );
      }

      return new Response(null, withStatus(204));
    }
  }

  return new Response(null, withStatus(400));
}

async function handleRequest(request: Request, env: Env) {
  const { valid, payload } = await isValidJwt(request, env);

  if (!valid) {
    return new Response(null, withStatus(403));
  }

  if (request.method === 'POST') {
    return handlePOSTRequests(request, payload);
  }
  if (request.method === 'DELETE') {
    return handleDELETERequests(request, payload);
  }

  return handleGETRequests(request, payload);
}
