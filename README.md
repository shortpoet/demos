# demos

## tags

```bash
git tag -a 0.1-Base_Config -m "VPS Examples: Vite + SSR + Typescript + Cloudflare Workers"
git push --follow-tags
git tag -d 1.0-Base_Config
git push --delete origin 1.0-Base_Config
```

## test-e2e

- port 3000 is hardcoded in the lib (setup.ts L264)

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

- no need for node-fetch these days it's implemented in their engine (find references)