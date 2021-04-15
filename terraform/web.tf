resource "aws_s3_bucket" "website" {
  bucket = "website.sandbox.sbir.nasa"

  website {
    index_document = "index.html"
  }
}

# resource "aws_s3_bucket" "website_bucket_policy" {
#   bucket = aws_s3_bucket.website.bucket

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Id      = "website-bucket-policy"
#     Statement = [{
#       Sid       = "cloudfront-allow"
#       Effect    = "Allow"
#       Principal = ""
#       Action    = "s3:GetObject"
#       Resource  = "${aws_s3_bucket.website.arn}"
#     }]
#   })
# }

resource "aws_cloudfront_distribution" "website_distribution" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = aws_s3_bucket.website.id
  }

  default_root_object = "index.html"
  enabled             = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.website.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
