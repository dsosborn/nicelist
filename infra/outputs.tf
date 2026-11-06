output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID for the frontend"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_region" {
  description = "AWS region where Cognito is deployed"
  value       = var.aws_region
}

output "cognito_hosted_ui_domain" {
  description = "Cognito hosted UI domain, without https://"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "appsync_graphql_endpoint" {
  description = "AppSync GraphQL API endpoint URL"
  value       = aws_appsync_graphql_api.main.uris["GRAPHQL"]
}

output "appsync_api_id" {
  description = "AppSync API ID"
  value       = aws_appsync_graphql_api.main.id
}

output "site_bucket" {
  description = "Private S3 bucket for the static export"
  value       = local.is_prod ? aws_s3_bucket.site[0].bucket : null
}

output "site_distribution_id" {
  description = "CloudFront distribution serving nicelist.co"
  value       = local.is_prod ? aws_cloudfront_distribution.site[0].id : null
}

output "appsync_api_key" {
  description = "Public API key for the guest list read"
  value       = aws_appsync_api_key.guest.key
  sensitive   = true
}

output "tfstate_bucket" {
  description = "Encrypted versioned bucket for remote Terraform state"
  value       = local.is_prod ? aws_s3_bucket.tfstate[0].bucket : null
}

output "tfstate_lock_table" {
  description = "DynamoDB lock table for remote Terraform state"
  value       = local.is_prod ? aws_dynamodb_table.tfstate_lock[0].name : null
}

output "github_deploy_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions via OIDC"
  value       = local.is_prod && var.github_repository != "" ? aws_iam_role.github_deploy[0].arn : null
}
