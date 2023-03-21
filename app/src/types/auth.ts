export { AuthUser, GithubUser, User };

type AuthUser = {
  id: string;
  name: string;
  token: string;
  email?: string;
};

type GithubUser = {
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  sub: string;
  email?: string;
};

type User = AuthUser & GithubUser;
