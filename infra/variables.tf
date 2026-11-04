variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "nicelist"
}

variable "aws_region" {
  description = "AWS region for Cognito and other resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS CLI profile. Leave unset in CI so the OIDC role is used."
  type        = string
  default     = null
}

variable "google_client_id" {
  description = "Google OAuth client id for the Cognito Google identity provider"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Initial Google client secret written to SSM. Later applies leave the stored value alone."
  type        = string
  sensitive   = true
  default     = ""
}

variable "amazon_associate_tag" {
  description = "Amazon Associates tag appended to shopper and guest product links. Empty until the account exists."
  type        = string
  default     = ""
}

variable "idea_model_id" {
  description = "Bedrock on-demand model for gift ideas"
  type        = string
  default     = "amazon.nova-micro-v1:0"
}

variable "guest_api_key_expires" {
  description = "Expiry for the public guest-read API key"
  type        = string
  default     = "2027-11-03T00:00:00Z"
}

variable "domain_name" {
  description = "Apex hostname for the static site"
  type        = string
  default     = "nicelist.co"
}

variable "oauth_callback_urls" {
  description = "Allowed Cognito OAuth callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login", "https://nicelist.co/login"]
}

variable "oauth_logout_urls" {
  description = "Allowed Cognito OAuth logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login", "https://nicelist.co/login"]
}
