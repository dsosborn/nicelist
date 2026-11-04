# Provider configuration
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  skip_metadata_api_check = true
}

# Runtime data (account, region) for use in other modules
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
