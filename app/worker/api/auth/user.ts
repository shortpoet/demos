import { isValidJwt } from '.';
import { Env } from '../../types';
import { createJsonResponse, generateUUID, logLevel } from '../../util';
import { RequestHandler } from '../RequestHandler';
import { User } from '../../../types';

const FILE_LOG_LEVEL = 'error';

export { handleUser };

async function handleUser(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  let res;

  if (url.pathname.startsWith('/api/auth/user')) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.api.auth.user.handleUser');
    }

    try {
      const { valid, payload, status } = await isValidJwt(handler, env, ctx);

      if (!valid) {
        res = createJsonResponse(
          {
            error: `worker.api.auth.user.handleUser.unauthorized.${payload}`,
          },
          handler,
          env,
          status,
        );
        return res;
      }
      let user: User;
      switch (method) {
        case 'GET':
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.api.auth.user.handleUser.get');
          }
          const userTokenParam = url.searchParams.get('userToken');
          user = JSON.parse(await env.DEMO_CFW_SSR.get(userTokenParam));
          res = await handler.handleRequest(env, ctx, user, 200, {
            withAuth: true,
          });
          break;
        case 'POST':
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.api.auth.user.handleUser.post');
          }
          user = await getUserFromCookie(handler, env);
          if (user !== undefined) {
            // console.log(
            //   'worker.api.auth.user.handleUser.post.user',
            //   user,
            // );
            res = await handler.handleRequest(env, ctx, user, 200, {
              withAuth: true,
            });
          } else {
            const generateUserId = (length: number) => {
              const charset = '0123456789abcdef';
              let retVal = '@user@';
              for (let i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
              }
              console.log(`\ngenerateUserId: \n${retVal}\n`);
              return retVal;
            };
            const userId = generateUserId(16);
            const userToken = await generateUserToken(env, userId);
            if (logLevel(FILE_LOG_LEVEL, env)) {
              console.log(`userToken: 
          XXXXXXXXXXXXXXXXXXXXX
          ${userToken}
          `);
              console.log(`userId:
          XXXXXXXXXXXXXXXXXXXXX
          ${userId}
          `);
            }
            user = {
              id: userId,
              user: handler.user,
              userId: handler.user.sub,
              created: new Date(Date.now()),
              updated: new Date(Date.now()),
              expires: new Date(Date.now() + 1000 * 60 * 60 * 3),
              accessToken: handler.user.token,
              userToken,
            };
            await env.DEMO_CFW_SSR.put(userId, JSON.stringify(user));

            res = await handler.handleRequest(env, ctx, { userToken }, 204, {
              withAuth: true,
            });
          }
          break;
        case 'DELETE':
          await env.DEMO_CFW_SSR.delete(handler.user.sub);
          res = await handler.handleRequest(env, ctx, { result: 'Ok' }, 204, {
            withAuth: true,
          });
          break;
        default:
          res = createJsonResponse(
            { error: `worker.api.auth.user.handleUser.method.${method}` },
            handler,
            env,
            404,
          );
          break;
      }
    } catch (error) {
      console.error(
        `Error: worker.api.auth.user.handleUser.error.method ${method}`,
      );
      console.error(error);
      res = createJsonResponse(
        { error: 'worker.api.auth.user.handleUser.error' },
        handler,
        env,
        404,
      );
    }
  }
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(
      'worker.api.auth.user.handleUser.res',
      JSON.stringify(res, null, 2),
    );
  }

  return res;
}
