resource "auth0_client" "this" {
  name = local.application_name

  app_type = "spa"

  allowed_logout_urls = [
    "http://localhost:3000/api",
    "http://localhost:3000/auth/logout",
    "http://localhost:3000",
    "https://${local.application_name}-dev.shortpoet.workers.dev",
    "https://${local.application_name}-dev.shortpoet.workers.dev/api",
    "https://${local.application_name}-dev.shortpoet.workers.dev/auth/logout",
    "https://${local.application_name}.shortpoet.workers.dev",
    "https://${local.application_name}.shortpoet.workers.dev/api",
    "https://${local.application_name}.shortpoet.workers.dev/auth/logout",
  ]
  allowed_origins = [
    "http://localhost:3000",
    "https://${local.application_name}-dev.shortpoet.workers.dev",
    "https://${local.application_name}.shortpoet.workers.dev",
  ]

  callbacks = [
    "http://localhost:3000/auth/callback",
    "http://localhost:3000/auth/popup-callback",
    "https://${local.application_name}-dev.shortpoet.workers.dev/auth/callback",
    "https://${local.application_name}-dev.shortpoet.workers.dev/auth/popup-callback",
    "https://${local.application_name}.shortpoet.workers.dev/auth/callback",
    "https://${local.application_name}.shortpoet.workers.dev/auth/popup-callback",
  ]
  web_origins = [
    "http://localhost:3000",
    "https://${local.application_name}-dev.shortpoet.workers.dev",
    "https://${local.application_name}.shortpoet.workers.dev",
  ]

  grant_types = ["refresh_token", "implicit", "authorization_code"]

  jwt_configuration {
    alg = "RS256"

    lifetime_in_seconds = 60 * 60 * 3

    scopes = {
      "openid"         = "openid"
      "profile"        = "profile"
      "email"          = "email"
      "offline_access" = "offline_access"
    }

    secret_encoded = false
  }

  # native_social_login {
  #   apple {
  #     enabled = false
  #   }

  #   facebook {
  #     enabled = false
  #   }
  # }

  # refresh_token {
  #   expiration_type = "non-expiring"

  #   idle_token_lifetime = 2592000

  #   infinite_idle_token_lifetime = true

  #   infinite_token_lifetime = true

  #   leeway = 0

  #   rotation_type = "non-rotating"

  #   token_lifetime = 31557600
  # }

  token_endpoint_auth_method = "none" # "client_secret_post"

  # cross_origin_auth = false

  # custom_login_page_on = true

  # is_first_party = true

  # is_token_endpoint_ip_header_trusted = false

  oidc_conformant = true

  # sso = false

  # sso_disabled = false

  # # addons {}

  # allowed_clients = []

  # client_aliases = []

  # client_metadata = {}

  # client_secret_rotation_trigger = null


  # cross_origin_loc = null

  # custom_login_page = null


  # description = ""

  # encryption_key = null # {}

  # form_template = null


  # initiate_login_uri = ""


  # logo_uri = ""

  # # mobile {
  # #   ios {

  # #   }
  # #   android {

  # #   }
  # # } 

  # organization_require_behavior = null

  # organization_usage = null


}
