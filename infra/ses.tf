resource "aws_ses_domain_identity" "site" {
  count  = local.is_prod ? 1 : 0
  domain = var.domain_name
}

moved {
  from = aws_ses_domain_identity.site
  to   = aws_ses_domain_identity.site[0]
}

resource "aws_route53_record" "ses_verification" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.site[0].verification_token]
}

moved {
  from = aws_route53_record.ses_verification
  to   = aws_route53_record.ses_verification[0]
}

resource "aws_ses_domain_identity_verification" "site" {
  count      = local.is_prod ? 1 : 0
  domain     = aws_ses_domain_identity.site[0].id
  depends_on = [aws_route53_record.ses_verification]
}

moved {
  from = aws_ses_domain_identity_verification.site
  to   = aws_ses_domain_identity_verification.site[0]
}

resource "aws_ses_domain_dkim" "site" {
  count  = local.is_prod ? 1 : 0
  domain = aws_ses_domain_identity.site[0].domain
}

moved {
  from = aws_ses_domain_dkim.site
  to   = aws_ses_domain_dkim.site[0]
}

resource "aws_route53_record" "ses_dkim" {
  count   = local.is_prod ? 3 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = "${aws_ses_domain_dkim.site[0].dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.site[0].dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_domain_mail_from" "site" {
  count            = local.is_prod ? 1 : 0
  domain           = aws_ses_domain_identity.site[0].domain
  mail_from_domain = "mail.${var.domain_name}"
}

moved {
  from = aws_ses_domain_mail_from.site
  to   = aws_ses_domain_mail_from.site[0]
}

resource "aws_route53_record" "ses_mail_from_mx" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = aws_ses_domain_mail_from.site[0].mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

moved {
  from = aws_route53_record.ses_mail_from_mx
  to   = aws_route53_record.ses_mail_from_mx[0]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = aws_ses_domain_mail_from.site[0].mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com -all"]
}

moved {
  from = aws_route53_record.ses_mail_from_spf
  to   = aws_route53_record.ses_mail_from_spf[0]
}
