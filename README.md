# demos

## Wrangler

- add other commands to package json to support wrangler
  - at this point we can use either the server or vite to serve the project

- add a vite config file to the project
  - this will allow us to use vite to serve and build the project
  - it will compile the project to the outdir of choice

- add account id to env 
  - don't commit

```bash
export CLOUDFLARE_ACCOUNT_ID=$(pass Cloud/cloudflare/account_id)
namespace='DEMO_CFW_SSR'
npx wrangler kv:namespace create "$namespace" && \
npx wrangler kv:namespace create "$namespace" --preview
```
