locals {
  application_name = "demo-cfw-ssr"
  description      = "Demo application for Cloudflare Workers and Server Side Rendering"

  base_urls = [
    "http://localhost:3000",
    "https://${local.application_name}-dev.shortpoet.workers.dev",
    "https://${local.application_name}.shortpoet.workers.dev",
  ]

  logout_suffixes = ["auth/logout", "auth0/logout", "api", ""]

  allowed_logout_urls = flatten([
    for base_url in local.base_urls : [
      for suffix in local.logout_suffixes : "${base_url}/${suffix}"
    ]
  ])

  allowed_origins = [
    for base_url in local.base_urls : "${base_url}"
  ]

  callback_suffixes = ["auth/callback", "auth/popup-callback", "auth0/callback"]

  callbacks = flatten([
    for base_url in local.base_urls : [
      for suffix in local.callback_suffixes : "${base_url}/${suffix}"
    ]
  ])

  web_origins = [
    for base_url in local.base_urls : "${base_url}"
  ]

}
