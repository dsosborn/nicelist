variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name"
  type        = string
  default     = ""
}

resource "aws_iam_openid_connect_provider" "github" {
  count = local.is_prod && var.github_repository != "" ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_deploy" {
  count = local.is_prod && var.github_repository != "" ? 1 : 0
  name  = "${var.project_name}-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github[0].arn
      }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_deploy" {
  count = local.is_prod && var.github_repository != "" ? 1 : 0
  name  = "github-deploy"
  role  = aws_iam_role.github_deploy[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.site[0].arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.site[0].arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = aws_cloudfront_distribution.site[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:*",
          "appsync:*",
          "dynamodb:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "ses:*",
          "lambda:*",
          "logs:*",
          "ssm:GetParameter",
          "ssm:PutParameter",
          "iam:*",
          "bedrock:InvokeModel",
          "bedrock:Converse",
        ]
        Resource = "*"
      },
    ]
  })
}
