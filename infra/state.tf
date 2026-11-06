resource "aws_s3_bucket" "tfstate" {
  count  = local.is_prod ? 1 : 0
  bucket = "${var.project_name}-tfstate-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

moved {
  from = aws_s3_bucket.tfstate
  to   = aws_s3_bucket.tfstate[0]
}

resource "aws_s3_bucket_versioning" "tfstate" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.tfstate[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

moved {
  from = aws_s3_bucket_versioning.tfstate
  to   = aws_s3_bucket_versioning.tfstate[0]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.tfstate[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

moved {
  from = aws_s3_bucket_server_side_encryption_configuration.tfstate
  to   = aws_s3_bucket_server_side_encryption_configuration.tfstate[0]
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  count                   = local.is_prod ? 1 : 0
  bucket                  = aws_s3_bucket.tfstate[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

moved {
  from = aws_s3_bucket_public_access_block.tfstate
  to   = aws_s3_bucket_public_access_block.tfstate[0]
}

resource "aws_dynamodb_table" "tfstate_lock" {
  count                       = local.is_prod ? 1 : 0
  name                        = "${var.project_name}-tfstate-lock"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "LockID"
  deletion_protection_enabled = true

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}

moved {
  from = aws_dynamodb_table.tfstate_lock
  to   = aws_dynamodb_table.tfstate_lock[0]
}
