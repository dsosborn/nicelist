resource "aws_dynamodb_table" "contributions" {
  name                        = "${local.name_prefix}-contributions"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "listId"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "listId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "mail" {
  name                        = "${local.name_prefix}-mail"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "dueDate"
  range_key                   = "listId"
  deletion_protection_enabled = true

  attribute {
    name = "dueDate"
    type = "S"
  }

  attribute {
    name = "listId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket" "images" {
  bucket = "${local.name_prefix}-gift-images"
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket                  = aws_s3_bucket.images.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "images" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.images.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.site[0].arn
        }
      }
    }]
  })
}

resource "aws_ssm_parameter" "stripe_secret" {
  name  = "/${local.name_prefix}/stripe-secret"
  type  = "SecureString"
  value = "pending"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "stripe_webhook" {
  name  = "/${local.name_prefix}/stripe-webhook"
  type  = "SecureString"
  value = "pending"

  lifecycle {
    ignore_changes = [value]
  }
}

data "archive_file" "preview" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/build/preview.zip"
  excludes    = ["ideas.mjs", "ideas.zip", "notify.mjs", "payments.mjs", "preview-edge.mjs.tftpl", "preview-edge.generated.mjs", "mail.mjs"]
}

data "archive_file" "notify" {
  type        = "zip"
  output_path = "${path.module}/build/notify.zip"
  source {
    content  = file("${path.module}/lambda/notify.mjs")
    filename = "notify.mjs"
  }
  source {
    content  = file("${path.module}/lambda/mail.mjs")
    filename = "mail.mjs"
  }
}

data "archive_file" "payments" {
  type        = "zip"
  source_file = "${path.module}/lambda/payments.mjs"
  output_path = "${path.module}/build/payments.zip"
}

locals {
  image_base = local.is_prod ? "https://${var.domain_name}" : ""
}

resource "local_file" "preview_edge" {
  filename = "${path.module}/lambda/preview-edge.generated.mjs"
  content = templatefile("${path.module}/lambda/preview-edge.mjs.tftpl", {
    lists_table = aws_dynamodb_table.lists.name
    gifts_table = aws_dynamodb_table.gifts.name
    image_base  = local.image_base
  })
}

data "archive_file" "preview_edge" {
  type        = "zip"
  output_path = "${path.module}/build/preview-edge.zip"
  source {
    content  = local_file.preview_edge.content
    filename = "preview-edge.mjs"
  }
  source {
    content  = file("${path.module}/lambda/preview-html.mjs")
    filename = "preview-html.mjs"
  }
}

resource "aws_iam_role" "preview" {
  name = "${local.name_prefix}-preview"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "preview_logs" {
  role       = aws_iam_role.preview.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "preview_images" {
  name = "preview-images"
  role = aws_iam_role.preview.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.images.arn}/gifts/*"
    }]
  })
}

resource "aws_lambda_function" "preview" {
  function_name    = "${local.name_prefix}-preview"
  role             = aws_iam_role.preview.arn
  runtime          = "nodejs20.x"
  handler          = "preview.handler"
  filename         = data.archive_file.preview.output_path
  source_code_hash = data.archive_file.preview.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      IMAGE_BUCKET   = aws_s3_bucket.images.id
      IMAGE_BASE_URL = local.image_base
    }
  }
}

resource "aws_iam_role" "notify" {
  name = "${local.name_prefix}-notify"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "notify_logs" {
  role       = aws_iam_role.notify.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "notify_send" {
  name = "notify-send"
  role = aws_iam_role.notify.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:Query", "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:UpdateItem"]
        Resource = [
          aws_dynamodb_table.profiles.arn,
          aws_dynamodb_table.relationships.arn,
          aws_dynamodb_table.claims.arn,
          aws_dynamodb_table.mail.arn,
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "notify" {
  function_name    = "${local.name_prefix}-notify"
  role             = aws_iam_role.notify.arn
  runtime          = "nodejs20.x"
  handler          = "notify.handler"
  filename         = data.archive_file.notify.output_path
  source_code_hash = data.archive_file.notify.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      MAIL_FROM            = local.is_prod ? "Nicelist <noreply@${var.domain_name}>" : ""
      SITE_ORIGIN          = local.is_prod ? "https://${var.domain_name}" : "http://localhost:3000"
      PROFILES_TABLE       = aws_dynamodb_table.profiles.name
      RELATIONSHIPS_TABLE  = aws_dynamodb_table.relationships.name
      CLAIMS_TABLE         = aws_dynamodb_table.claims.name
      MAIL_TABLE           = aws_dynamodb_table.mail.name
    }
  }
}

resource "aws_cloudwatch_event_rule" "digest" {
  name                = "${local.name_prefix}-still-open"
  schedule_expression = "cron(0 15 * * ? *)"
}

resource "aws_cloudwatch_event_target" "digest" {
  rule = aws_cloudwatch_event_rule.digest.name
  arn  = aws_lambda_function.notify.arn
  input = jsonencode({ action = "digest" })
}

resource "aws_lambda_permission" "digest" {
  statement_id  = "AllowDigest"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notify.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.digest.arn
}

resource "aws_iam_role" "payments" {
  name = "${local.name_prefix}-payments"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "payments_logs" {
  role       = aws_iam_role.payments.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "payments_ssm" {
  name = "payments-ssm"
  role = aws_iam_role.payments.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = [aws_ssm_parameter.stripe_secret.arn, aws_ssm_parameter.stripe_webhook.arn]
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:UpdateItem"]
        Resource = [
          aws_dynamodb_table.contributions.arn,
          aws_dynamodb_table.profiles.arn,
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "payments" {
  function_name    = "${local.name_prefix}-payments"
  role             = aws_iam_role.payments.arn
  runtime          = "nodejs20.x"
  handler          = "payments.handler"
  filename         = data.archive_file.payments.output_path
  source_code_hash = data.archive_file.payments.output_base64sha256
  timeout          = 20
  memory_size      = 256

  environment {
    variables = {
      STRIPE_SECRET_PARAM   = aws_ssm_parameter.stripe_secret.name
      STRIPE_WEBHOOK_PARAM  = aws_ssm_parameter.stripe_webhook.name
      CONTRIBUTIONS_TABLE   = aws_dynamodb_table.contributions.name
      PROFILES_TABLE        = aws_dynamodb_table.profiles.name
      SITE_ORIGIN           = local.is_prod ? "https://${var.domain_name}" : "http://localhost:3000"
    }
  }
}

resource "aws_lambda_function_url" "payments" {
  function_name      = aws_lambda_function.payments.function_name
  authorization_type = "NONE"
}

resource "aws_iam_role" "preview_edge" {
  name = "${local.name_prefix}-preview-edge"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = {
        Service = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "preview_edge_logs" {
  role       = aws_iam_role.preview_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "preview_edge_read" {
  name = "preview-edge-read"
  role = aws_iam_role.preview_edge.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["dynamodb:Query"]
      Resource = [
        aws_dynamodb_table.lists.arn,
        "${aws_dynamodb_table.lists.arn}/index/*",
        aws_dynamodb_table.gifts.arn,
      ]
    }]
  })
}

resource "aws_lambda_permission" "preview_edge" {
  count         = local.is_prod ? 1 : 0
  statement_id  = "AllowCloudFront"
  action        = "lambda:GetFunction"
  function_name = aws_lambda_function.preview_edge.function_name
  principal     = "edgelambda.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.site[0].arn
}

resource "aws_lambda_function" "preview_edge" {
  function_name    = "${local.name_prefix}-preview-edge"
  role             = aws_iam_role.preview_edge.arn
  runtime          = "nodejs20.x"
  handler          = "preview-edge.handler"
  filename         = data.archive_file.preview_edge.output_path
  source_code_hash = data.archive_file.preview_edge.output_base64sha256
  timeout          = 5
  memory_size      = 128
  publish          = true
}

resource "aws_iam_role" "appsync_workers" {
  name = "${local.name_prefix}-appsync-workers"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_workers" {
  name = "appsync-workers"
  role = aws_iam_role.appsync_workers.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["lambda:InvokeFunction"]
      Resource = [
        aws_lambda_function.preview.arn,
        aws_lambda_function.notify.arn,
        aws_lambda_function.payments.arn,
      ]
    }]
  })
}

resource "aws_appsync_datasource" "contributions" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "Contributions"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = aws_dynamodb_table.contributions.name
  }
}

resource "aws_appsync_datasource" "mail" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "Mail"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = aws_dynamodb_table.mail.name
  }
}

resource "aws_appsync_datasource" "preview" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "PreviewLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_workers.arn
  lambda_config {
    function_arn = aws_lambda_function.preview.arn
  }
}

resource "aws_appsync_datasource" "notify" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "NotifyLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_workers.arn
  lambda_config {
    function_arn = aws_lambda_function.notify.arn
  }
}

resource "aws_appsync_datasource" "payments" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "PaymentsLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_workers.arn
  lambda_config {
    function_arn = aws_lambda_function.payments.arn
  }
}
