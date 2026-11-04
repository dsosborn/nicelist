resource "aws_ssm_parameter" "google_client_secret" {
  name  = "/${local.name_prefix}/google-client-secret"
  type  = "SecureString"
  value = var.google_client_secret == "" ? "pending" : var.google_client_secret

  lifecycle {
    ignore_changes = [value]
  }
}