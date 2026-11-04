locals {
  name_prefix = terraform.workspace == "default" ? var.project_name : "${var.project_name}-${terraform.workspace}"
}

resource "aws_dynamodb_table" "profiles" {
  name                        = "${local.name_prefix}-profiles"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "userId"
  deletion_protection_enabled = true

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "emailLower"
    type = "S"
  }

  global_secondary_index {
    name            = "emailLower-index"
    hash_key        = "emailLower"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "relationships" {
  name                        = "${local.name_prefix}-relationships"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "userId"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "lists" {
  name                        = "${local.name_prefix}-lists"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "ownerId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "shareToken"
    type = "S"
  }

  attribute {
    name = "recipientId"
    type = "S"
  }

  global_secondary_index {
    name            = "ownerId-createdAt"
    hash_key        = "ownerId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "shareToken-index"
    hash_key        = "shareToken"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "recipientId-index"
    hash_key        = "recipientId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "gifts" {
  name                        = "${local.name_prefix}-gifts"
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
}

resource "aws_dynamodb_table" "claims" {
  name                        = "${local.name_prefix}-claims"
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
}

resource "aws_dynamodb_table" "shopping" {
  name                        = "${local.name_prefix}-shopping"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "shopperId"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "shopperId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "ratings" {
  name                        = "${local.name_prefix}-ratings"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "recipientId"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "recipientId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}
