declare module "*.vue" {
  const Component: any;
  export default Component;
}

declare interface Window {
  auth0: Auth0Client;
  webAuth: any;
  webAuthPasswordless: any;
  Cookies: any;
}
