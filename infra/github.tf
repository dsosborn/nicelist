variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name"
  type        = string
  default     = "dsosborn/nicelist"
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
        Sid      = "SiteAndStateBuckets"
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = [
          aws_s3_bucket.site[0].arn,
          "${aws_s3_bucket.site[0].arn}/*",
          aws_s3_bucket.tfstate[0].arn,
          "${aws_s3_bucket.tfstate[0].arn}/*",
        ]
      },
      {
        Sid      = "ProjectDynamoTables"
        Effect   = "Allow"
        Action   = ["dynamodb:*"]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-*",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.project_name}-*/index/*",
        ]
      },
      {
        Sid      = "ProjectIamRoles"
        Effect   = "Allow"
        Action   = ["iam:*"]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com",
        ]
      },
      {
        Sid      = "ProjectSsm"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:PutParameter", "ssm:DescribeParameters", "ssm:ListTagsForResource"]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}*"
      },
      {
        Sid    = "ManagedStackServices"
        Effect = "Allow"
        Action = [
          "cognito-idp:*",
          "appsync:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "ses:*",
          "lambda:*",
          "logs:*",
          "bedrock:InvokeModel",
          "bedrock:Converse",
        ]
        Resource = "*"
      },
    ]
  })
}
