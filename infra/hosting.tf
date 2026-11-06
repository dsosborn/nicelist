data "aws_route53_zone" "site" {
  count        = local.is_prod ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

resource "aws_acm_certificate" "site" {
  count                     = local.is_prod ? 1 : 0
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

moved {
  from = aws_acm_certificate.site
  to   = aws_acm_certificate.site[0]
}

resource "aws_route53_record" "site_cert_validation" {
  for_each = local.is_prod ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  zone_id         = data.aws_route53_zone.site[0].zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  count                   = local.is_prod ? 1 : 0
  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for record in aws_route53_record.site_cert_validation : record.fqdn]
}

moved {
  from = aws_acm_certificate_validation.site
  to   = aws_acm_certificate_validation.site[0]
}

resource "aws_s3_bucket" "site" {
  count  = local.is_prod ? 1 : 0
  bucket = "${var.project_name}-site-${data.aws_caller_identity.current.account_id}"
}

moved {
  from = aws_s3_bucket.site
  to   = aws_s3_bucket.site[0]
}

resource "aws_s3_bucket_versioning" "site" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.site[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.site[0].id

  rule {
    id     = "expire-noncurrent"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  depends_on = [aws_s3_bucket_versioning.site]
}

resource "aws_s3_bucket_public_access_block" "site" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.site[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

moved {
  from = aws_s3_bucket_public_access_block.site
  to   = aws_s3_bucket_public_access_block.site[0]
}

resource "aws_cloudfront_origin_access_control" "site" {
  count                             = local.is_prod ? 1 : 0
  name                              = "${var.project_name}-site"
  description                       = "Access to the Nicelist static site bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

moved {
  from = aws_cloudfront_origin_access_control.site
  to   = aws_cloudfront_origin_access_control.site[0]
}

resource "aws_cloudfront_function" "site_router" {
  count   = local.is_prod ? 1 : 0
  name    = "${var.project_name}-site-router"
  runtime = "cloudfront-js-2.0"
  comment = "Redirect www to the apex and map extensionless paths to the static export"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      var host = request.headers.host && request.headers.host.value;
      if (host === "www.${var.domain_name}") {
        var qs = [];
        var params = request.querystring || {};
        for (var key in params) {
          var entry = params[key];
          var values = entry.multiValue ? entry.multiValue : [entry];
          for (var i = 0; i < values.length; i++) {
            if (!values[i] || values[i].value === undefined) continue;
            qs.push(encodeURIComponent(key) + "=" + encodeURIComponent(values[i].value));
          }
        }
        var location = "https://${var.domain_name}" + request.uri;
        if (qs.length) location += "?" + qs.join("&");
        return {
          statusCode: 301,
          statusDescription: "Moved Permanently",
          headers: { location: { value: location } }
        };
      }
      var uri = request.uri;
      if (uri.endsWith("/")) {
        request.uri += "index.html";
      } else if (uri.indexOf(".") === -1) {
        request.uri += ".html";
      }
      return request;
    }
  JS
}

moved {
  from = aws_cloudfront_function.site_router
  to   = aws_cloudfront_function.site_router[0]
}

resource "aws_cloudfront_distribution" "site" {
  count               = local.is_prod ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Nicelist static site"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name              = aws_s3_bucket.site[0].bucket_regional_domain_name
    origin_id                = "site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site[0].id
  }

  default_cache_behavior {
    target_origin_id           = "site"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.site_router[0].arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site[0].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

moved {
  from = aws_cloudfront_distribution.site
  to   = aws_cloudfront_distribution.site[0]
}

resource "aws_s3_bucket_policy" "site" {
  count  = local.is_prod ? 1 : 0
  bucket = aws_s3_bucket.site[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.site[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.site[0].arn
          }
        }
      }
    ]
  })
}

moved {
  from = aws_s3_bucket_policy.site
  to   = aws_s3_bucket_policy.site[0]
}

resource "aws_route53_record" "site_apex_a" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site[0].domain_name
    zone_id                = aws_cloudfront_distribution.site[0].hosted_zone_id
    evaluate_target_health = false
  }
}

moved {
  from = aws_route53_record.site_apex_a
  to   = aws_route53_record.site_apex_a[0]
}

resource "aws_route53_record" "site_apex_aaaa" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site[0].domain_name
    zone_id                = aws_cloudfront_distribution.site[0].hosted_zone_id
    evaluate_target_health = false
  }
}

moved {
  from = aws_route53_record.site_apex_aaaa
  to   = aws_route53_record.site_apex_aaaa[0]
}

resource "aws_route53_record" "site_www_a" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site[0].domain_name
    zone_id                = aws_cloudfront_distribution.site[0].hosted_zone_id
    evaluate_target_health = false
  }
}

moved {
  from = aws_route53_record.site_www_a
  to   = aws_route53_record.site_www_a[0]
}

resource "aws_route53_record" "site_www_aaaa" {
  count   = local.is_prod ? 1 : 0
  zone_id = data.aws_route53_zone.site[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site[0].domain_name
    zone_id                = aws_cloudfront_distribution.site[0].hosted_zone_id
    evaluate_target_health = false
  }
}

moved {
  from = aws_route53_record.site_www_aaaa
  to   = aws_route53_record.site_www_aaaa[0]
}
