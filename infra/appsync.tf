resource "aws_appsync_graphql_api" "main" {
  name                = "${local.name_prefix}-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  schema              = file("${path.module}/schema.graphql")

  user_pool_config {
    aws_region     = var.aws_region
    default_action = "ALLOW"
    user_pool_id   = aws_cognito_user_pool.main.id
  }

  additional_authentication_provider {
    authentication_type = "API_KEY"
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level           = "ERROR"
  }
}

resource "aws_appsync_api_key" "guest" {
  api_id  = aws_appsync_graphql_api.main.id
  expires = var.guest_api_key_expires
}

resource "aws_iam_role" "appsync_logs" {
  name = "${local.name_prefix}-appsync-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs" {
  role       = aws_iam_role.appsync_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

resource "aws_cloudwatch_log_group" "appsync" {
  name              = "/aws/appsync/apis/${aws_appsync_graphql_api.main.id}"
  retention_in_days = 7
}

resource "aws_appsync_datasource" "profiles" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "ProfilesTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.profiles.name
  }
}

resource "aws_appsync_datasource" "relationships" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "RelationshipsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.relationships.name
  }
}

resource "aws_appsync_datasource" "lists" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "ListsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.lists.name
  }
}

resource "aws_appsync_datasource" "gifts" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "GiftsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.gifts.name
  }
}

resource "aws_appsync_datasource" "claims" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "ClaimsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.claims.name
  }
}

resource "aws_appsync_datasource" "shopping" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "ShoppingTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.shopping.name
  }
}

resource "aws_appsync_datasource" "ratings" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "RatingsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.ratings.name
  }
}

resource "aws_appsync_datasource" "pokes" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "PokesTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn

  dynamodb_config {
    table_name = aws_dynamodb_table.pokes.name
  }
}

resource "aws_appsync_datasource" "ideas" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "IdeasLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_ideas.arn

  lambda_config {
    function_arn = aws_lambda_function.ideas.arn
  }
}

resource "aws_iam_role" "appsync_dynamodb" {
  name = "${local.name_prefix}-appsync-dynamodb"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_dynamodb" {
  name = "appsync-dynamodb"
  role = aws_iam_role.appsync_dynamodb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
      ]
      Resource = [
        aws_dynamodb_table.profiles.arn,
        "${aws_dynamodb_table.profiles.arn}/index/*",
        aws_dynamodb_table.relationships.arn,
        "${aws_dynamodb_table.relationships.arn}/index/*",
        aws_dynamodb_table.lists.arn,
        "${aws_dynamodb_table.lists.arn}/index/*",
        aws_dynamodb_table.gifts.arn,
        "${aws_dynamodb_table.gifts.arn}/index/*",
        aws_dynamodb_table.claims.arn,
        "${aws_dynamodb_table.claims.arn}/index/*",
        aws_dynamodb_table.shopping.arn,
        "${aws_dynamodb_table.shopping.arn}/index/*",
        aws_dynamodb_table.ratings.arn,
        "${aws_dynamodb_table.ratings.arn}/index/*",
        aws_dynamodb_table.pokes.arn,
        "${aws_dynamodb_table.pokes.arn}/index/*",
      ]
    }]
  })
}

resource "aws_iam_role" "appsync_ideas" {
  name = "${local.name_prefix}-appsync-ideas"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_ideas" {
  name = "appsync-ideas"
  role = aws_iam_role.appsync_ideas.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["lambda:InvokeFunction"]
      Resource = aws_lambda_function.ideas.arn
    }]
  })
}

locals {
  resolver_manifest = jsondecode(file("${path.module}/resolver-src/manifest.json"))
  app_datasources = {
    profiles      = aws_appsync_datasource.profiles.name
    relationships = aws_appsync_datasource.relationships.name
    lists         = aws_appsync_datasource.lists.name
    gifts         = aws_appsync_datasource.gifts.name
    claims        = aws_appsync_datasource.claims.name
    shopping      = aws_appsync_datasource.shopping.name
    ratings       = aws_appsync_datasource.ratings.name
    pokes         = aws_appsync_datasource.pokes.name
    ideas         = aws_appsync_datasource.ideas.name
  }
}

resource "aws_appsync_function" "fn" {
  for_each = local.resolver_manifest.datasources

  api_id      = aws_appsync_graphql_api.main.id
  name        = each.key
  data_source = local.app_datasources[each.value]
  code = templatefile("${path.module}/resolvers/built/${each.key}.js", {
    name_prefix   = local.name_prefix
    associate_tag = var.amazon_associate_tag
  })

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "aws_appsync_resolver" "pipe" {
  for_each = local.resolver_manifest.pipelines

  api_id = aws_appsync_graphql_api.main.id
  type   = split(".", each.key)[0]
  field  = split(".", each.key)[1]
  kind   = "PIPELINE"
  code = templatefile("${path.module}/resolvers/built/pipeline.js", {
    name_prefix   = local.name_prefix
    associate_tag = var.amazon_associate_tag
  })

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  pipeline_config {
    functions = [for name in each.value : aws_appsync_function.fn[name].function_id]
  }
}
