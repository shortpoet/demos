resource "auth0_client" "this" {
  name        = local.application_name
  description = local.description

  app_type = "spa"

  allowed_logout_urls = local.allowed_logout_urls
  allowed_origins     = local.allowed_origins
  callbacks           = local.callbacks
  web_origins         = local.web_origins

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

  token_endpoint_auth_method = "none" # "client_secret_post"

  oidc_conformant = true

  # native_social_login {
  #   apple {
  #     enabled = false
  #   }

  #   facebook {
  #     enabled = false
  #   }
  # }

  refresh_token {
    expiration_type = "expiring"

    idle_token_lifetime = 60 * 60 * 1

    infinite_idle_token_lifetime = false

    infinite_token_lifetime = false

    leeway = 3

    rotation_type = "rotating"

    token_lifetime = 60 * 60 * 3
  }

  # cross_origin_auth = false

  # custom_login_page_on = true

  # is_first_party = true

  # is_token_endpoint_ip_header_trusted = false

  # sso = false

  # sso_disabled = false

  # # addons {}

  # allowed_clients = []

  # client_aliases = []

  # client_metadata = {}

  # client_secret_rotation_trigger = null

  # cross_origin_loc = null

  # custom_login_page = null


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
