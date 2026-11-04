data "archive_file" "ideas" {
  type        = "zip"
  source_file = "${path.module}/lambda/ideas.mjs"
  output_path = "${path.module}/lambda/ideas.zip"
}

resource "aws_iam_role" "ideas" {
  name = "${local.name_prefix}-ideas"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ideas_logs" {
  role       = aws_iam_role.ideas.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "ideas_bedrock" {
  name = "ideas-bedrock"
  role = aws_iam_role.ideas.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["bedrock:InvokeModel", "bedrock:Converse"]
      Resource = [
        "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.idea_model_id}",
        "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:inference-profile/*",
      ]
    }]
  })
}

resource "aws_lambda_function" "ideas" {
  function_name    = "${local.name_prefix}-ideas"
  role             = aws_iam_role.ideas.arn
  runtime          = "nodejs20.x"
  handler          = "ideas.handler"
  filename         = data.archive_file.ideas.output_path
  source_code_hash = data.archive_file.ideas.output_base64sha256
  timeout          = 20
  memory_size      = 256

  environment {
    variables = {
      IDEA_MODEL_ID = var.idea_model_id
    }
  }
}

resource "aws_cloudwatch_log_group" "ideas" {
  name              = "/aws/lambda/${aws_lambda_function.ideas.function_name}"
  retention_in_days = 14
}
