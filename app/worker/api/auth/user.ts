import { isValidJwt } from '.';
import { Env } from '../../types';
import {
  createJsonResponse,
  generateTypedUUID,
  generateUUID,
  logLevel,
} from '../../util';
import { RequestHandler } from '../RequestHandler';
import { User } from '../../../types';

const FILE_LOG_LEVEL = 'error';

export { getUser, putUser };

const getUser = async (id: string, env: Env): Promise<User> => {
  const user = JSON.parse(await env.DEMO_CFW_SSR_USERS.get(id));
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
};

const putUser = async (user: User, env: Env): Promise<void> => {
  await env.DEMO_CFW_SSR_USERS.put(user.sub, JSON.stringify(user));
};

const sessionUser = async (user: User, env: Env): Promise<User> => {
  const admins = env.ADMIN_USERS.split(',');
  const existing = await getUser(user.sub, env);
  if (existing) {
    return existing;
  }
  user = { ...user, id: generateTypedUUID(8, 'user'), role: role };
  await putUser(user, env);
  return user;
};
