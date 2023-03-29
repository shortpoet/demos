import { Env } from '../../types';
import { generateTypedUUID } from '../../util';
import { User } from '../../../types';

const FILE_LOG_LEVEL = 'error';

export { getUser, putUser, sessionUser };

const getUser = async (id: string, env: Env): Promise<User> => {
  const user = JSON.parse(await env.DEMO_CFW_SSR_USERS.get(id));
  return user;
};

const putUser = async (user: User, env: Env): Promise<void> => {
  await env.DEMO_CFW_SSR_USERS.put(user.sub, JSON.stringify(user));
};

const sessionUser = async (user: User, env: Env): Promise<User> => {
  console.log('sessionUser.start', JSON.stringify(user, null, 2));
  const admins = env.ADMIN_USERS.split(',');
  const role = admins.includes(user.sub) ? 'admin' : 'user';
  let existing = await getUser(user.sub, env);
  if (existing) {
    if (existing.role !== role) {
      existing = { ...user, role: role };
      await putUser(user, env);
    }
    console.log('sessionUser.existing.end', JSON.stringify(existing, null, 2));
    return existing;
  } else {
    user = { ...user, id: generateTypedUUID(8, 'user'), role: role };
    await putUser(user, env);
    console.log('sessionUser.newuser.end', JSON.stringify(user, null, 2));
    return user;
  }
};
