# Cognito User Pool for custom auth (sign-in, sign-up, etc.)
resource "aws_cognito_user_pool" "main" {
  name           = "${local.name_prefix}-user-pool"
  user_pool_tier = "LITE"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"

  dynamic "username_configuration" {
    for_each = local.is_prod ? [] : [1]
    content {
      case_sensitive = false
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  dynamic "email_configuration" {
    for_each = local.is_prod ? [1] : []
    content {
      email_sending_account = "DEVELOPER"
      source_arn            = aws_ses_domain_identity.site[0].arn
      from_email_address    = "Nicelist <noreply@${var.domain_name}>"
    }
  }

  dynamic "email_configuration" {
    for_each = local.is_prod ? [] : [1]
    content {
      email_sending_account = "COGNITO_DEFAULT"
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your Nicelist verification code"
    email_message        = "Your Nicelist verification code is {####}"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# App client for frontend (custom form - no secret)
resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.name_prefix}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  read_attributes  = ["email", "email_verified", "name"]
  write_attributes = ["email", "name"]

  refresh_token_validity = 30
  access_token_validity  = 60
  id_token_validity      = 60
  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO", "Google"]

  callback_urls = var.oauth_callback_urls
  logout_urls   = var.oauth_logout_urls

  depends_on = [aws_cognito_identity_provider.google]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = aws_ssm_parameter.google_client_secret.value
    authorize_scopes              = "openid email profile"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}
