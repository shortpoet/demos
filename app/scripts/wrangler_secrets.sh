#!/usr/bin/env bash

# This file is sourced by the wrangler build script to set the secrets

script_root=$(dirname "$0")
env_file="$script_root/../.env"

[[ ! -f "$env_file" ]] && echo "No .env file found" && exit 1
source "$env_file"

[[ -z "$VITE_APP_NAME" ]] && echo "VITE_APP_NAME not set" && exit 1

declare -A secrets=(
  # ["AUTH0_DOMAIN"]='Cloud/auth0/shortpoet/domain'
  ["AUTH0_CLIENT_ID"]="Cloud/auth0/$VITE_APP_NAME/client_id"
)

set_secret() {
  key="$1"
  value="$2"
  env="$3"
  # echo "pass $value"
  secret=$(pass "$value")
  if [[ -n "$env" ]]; then
    echo "$secret" | npx wrangler secret put "$key" --env "$env"
  else
    echo "$secret" | npx wrangler secret put "$key"
  fi
}

for key in "${!secrets[@]}"; do
  echo "Setting secret $key"
  set_secret "$key" "${secrets[$key]}"
done


# kv=$(npx wrangler kv:namespace list)
# echo "$kv" | jq -r '. | map(select(.title | strings | contains("demo"))) | .[].id ' | while read -r id; do
#   echo "Deleting KV $id"
#   npx wrangler kv:namespace delete --namespace-id "$id"
# done