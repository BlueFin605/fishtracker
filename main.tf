# ======================================================================================================
# Providers
# ======================================================================================================

provider "aws" {
  region = "eu-central-1"
  alias  = "eu-central-1"
}

provider "aws" {
  region  = "us-east-1"
  alias   = "us-east-1"
}

# ======================================================================================================
# Variables
# ======================================================================================================

variable "integration_response_parameters" {
   type = map(string)
   default = {
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-amz-content-sha256'"
        "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
     }
}

variable "fishtracker_dns_zone" {
  type = string
  default = "bluefin605.com"
}

variable "api_dns_name" {
  description = "Domain name for web api for fishtracker"
  default     = "api.fishtracker"
}

variable "web_dns_name" {
  description = "Domain name for website for fishtracker"
  default     = "fishtracker"
}

variable "process_route53_records" {
  default = true
}

# =====================================================================================================================================
# =====================================================================================================================================
#
# Lambda Roles & Policies
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_iam_policy" "lambda-policy" {
  provider = aws.eu-central-1 
  name        = "fishtracker-lambda-policy-prod"
  path        = "/fishtracker/"
  description = "fishtracker lambda policy"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DescribeTable"
            ],
            "Resource": "arn:aws:dynamodb:*:083148603667:table/*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:*:083148603667:table/*/index/*"
        }
    ]
  })
  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}


data "aws_iam_policy_document" "lambda-assume-role-policy" {
  provider = aws.eu-central-1 
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  provider = aws.eu-central-1 
  name = "fishtracker-lambda-role-prod"
  assume_role_policy = data.aws_iam_policy_document.lambda-assume-role-policy.json
  managed_policy_arns = [aws_iam_policy.lambda-policy.arn,"arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

# =====================================================================================================================================
# =====================================================================================================================================
#
# User Access Role & Policy
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_iam_policy" "user-access-policy" {
  provider = aws.eu-central-1 
  name        = "fishtracker-user-access-policy-prod"
  path        = "/fishtracker/"
  description = "fishtracker user access policy"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DescribeTable",
				        "execute-api:Invoke"
            ],
            "Resource": [
				        "arn:aws:execute-api:eu-central-1:083148603667:9gg2ogwlzd/Prod/*/*",
                "arn:aws:dynamodb:*:083148603667:table/*"
            ]
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:*:083148603667:table/*/index/*"
        }
    ]
  })
  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}


data "aws_iam_policy_document" "user-access-assume-role-policy" {
  provider = aws.eu-central-1 
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }

  statement {
    actions = ["sts:AssumeRole", "sts:TagSession"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.lambda_role.arn]
    }
  }
}

resource "aws_iam_role" "user_access_role" {
  provider = aws.eu-central-1 
  name = "fishtracker-user-access-role-prod"
  assume_role_policy = data.aws_iam_policy_document.user-access-assume-role-policy.json
  managed_policy_arns = [aws_iam_policy.user-access-policy.arn]
  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

# =====================================================================================================================================
# =====================================================================================================================================
#
# Lambda Function
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_s3_bucket" "lambda-deploymentpackage" {
  provider = aws.eu-central-1 
  bucket = "fishtracker-lambda-deploymentpackage-prod"

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

resource "aws_s3_bucket_ownership_controls" "lambda-deploymentpackage" {
  provider = aws.eu-central-1 
  bucket = aws_s3_bucket.lambda-deploymentpackage.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "lambda-deploymentpackage" {
  provider = aws.eu-central-1 
  depends_on = [aws_s3_bucket_ownership_controls.lambda-deploymentpackage]
  bucket     = aws_s3_bucket.lambda-deploymentpackage.id
  acl        = "private"
}

resource "aws_s3_object" "object" {
  provider = aws.eu-central-1 
  bucket = aws_s3_bucket.lambda-deploymentpackage.id
  key    = "lambda-deploymentpackage.zip"
  acl    = "private"
  source = "lambda-deploymentpackage.zip"
}

resource "aws_lambda_function" "terraform_lambda_func" {
  provider = aws.eu-central-1 
  function_name = "FishTracker_Lambda_Function_Prod"
  role          = aws_iam_role.lambda_role.arn
  handler       = "FishTrackerLambda::FishTrackerLambda.LambdaEntryPoint::FunctionHandlerAsync"
  runtime       = "dotnet6"
  timeout       = 20
  s3_bucket     = aws_s3_bucket.lambda-deploymentpackage.bucket
  s3_key        = aws_s3_object.object.key
  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

# =====================================================================================================================================
# =====================================================================================================================================
#
# Dynamodb tables
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_dynamodb_table" "dynamo-catchhistory-table-prod" {
  provider = aws.eu-central-1 
  name           = "fishtracker-CatchHistory-Prod"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "QuestionId"

  attribute {
    name = "QuestionId"
    type = "S"
  }

#  ttl {
#    attribute_name = "TimeToExist"
#    enabled        = false
#  }

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

# =====================================================================================================================================
# =====================================================================================================================================
#
# AWS Certificate
#
# =====================================================================================================================================
# =====================================================================================================================================

# This creates an SSL certificate
resource "aws_acm_certificate" "cert" {
  provider = aws.us-east-1 
  domain_name       = "${data.aws_route53_zone.Public.name}"
  validation_method = "DNS"
  subject_alternative_names =["${var.api_dns_name}.${data.aws_route53_zone.Public.name}", "${var.web_dns_name}.${data.aws_route53_zone.Public.name}", "www.${data.aws_route53_zone.Public.name}"]
  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}


# =====================================================================================================================================
# =====================================================================================================================================
#
# AI Gateway
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_api_gateway_rest_api" "gateway-prod" {
  provider = aws.eu-central-1 
  name        = "fishtracker-api-prod"
  description = "FishTracker API Gateway"
  endpoint_configuration {
    types     = ["REGIONAL"]
  }

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

resource "aws_api_gateway_domain_name" "gateway-prod" {
  provider = aws.eu-central-1 
  domain_name = "${var.api_dns_name}.${data.aws_route53_zone.Public.name}"
  certificate_arn = aws_acm_certificate.cert.arn
#  lifecycle {
#    prevent_destroy = true
#  }
}

resource "aws_api_gateway_deployment" "gateway-prod-deployment" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.gateway-prod.body))
  }

  lifecycle {
    create_before_destroy = true
  }
 
  depends_on = [aws_api_gateway_method.get-api-authenticate-question, 
                aws_api_gateway_method.get-api-question, 
                aws_api_gateway_method.post-api-question, 
                aws_api_gateway_method.options-api-question, 
                aws_api_gateway_method.post-api-questionmanager, 
                aws_api_gateway_method.get-api-questionmanager, 
                aws_api_gateway_method.options-api-questionmanager, 
                aws_api_gateway_integration.integration-options-api-question,
                aws_api_gateway_integration.integration-request-get-api-authenticate-question,
                aws_api_gateway_integration.integration-options-api-questionmanager,
                aws_api_gateway_integration.integration-options-api-authenticate-question,
                aws_api_gateway_integration.integration-request-post-api-questionmanager,
                aws_api_gateway_integration.integration-request-get-api-questionmanager,
                aws_api_gateway_integration.integration-request-get-api-question,
                aws_api_gateway_integration.integration-request-post-api-question
               ]

  # This forces a deployment - see https://medium.com/coryodaniel/til-forcing-terraform-to-deploy-a-aws-api-gateway-deployment-ed36a9f60c1a
  # variables = {
  #   deployed_at = "${var.deployed_at}"
  # }
}

resource "aws_api_gateway_stage" "gateway-prod-stage-prod" {
  provider = aws.eu-central-1 
  deployment_id = aws_api_gateway_deployment.gateway-prod-deployment.id
  rest_api_id   = aws_api_gateway_rest_api.gateway-prod.id
  stage_name    = "Prod"

  depends_on = [aws_api_gateway_method.get-api-authenticate-question, 
                aws_api_gateway_method.get-api-question, 
                aws_api_gateway_method.post-api-question, 
                aws_api_gateway_method.options-api-question, 
                aws_api_gateway_method.post-api-questionmanager, 
                aws_api_gateway_method.get-api-questionmanager, 
                aws_api_gateway_method.options-api-questionmanager, 
                aws_api_gateway_integration.integration-options-api-question,
                aws_api_gateway_integration.integration-request-get-api-authenticate-question,
                aws_api_gateway_integration.integration-options-api-questionmanager,
                aws_api_gateway_integration.integration-options-api-authenticate-question,
                aws_api_gateway_integration.integration-request-post-api-questionmanager,
                aws_api_gateway_integration.integration-request-get-api-questionmanager,
                aws_api_gateway_integration.integration-request-get-api-question,
                aws_api_gateway_integration.integration-request-post-api-question
               ]  
}

resource "aws_api_gateway_method_settings" "gateway-prod-settings" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  stage_name  = aws_api_gateway_stage.gateway-prod-stage-prod.stage_name
  method_path = "*/*"

  settings {
    # Set throttling values
    throttling_burst_limit = 5
    throttling_rate_limit  = 1

    metrics_enabled = true

    # Actually disable throttling
    #throttling_burst_limit = -1
    #throttling_rate_limit  = -1
  }
}

resource "aws_api_gateway_base_path_mapping" "gateway-prod-mapping" {
  provider = aws.eu-central-1 
  api_id      = aws_api_gateway_rest_api.gateway-prod.id
  stage_name  = aws_api_gateway_stage.gateway-prod-stage-prod.stage_name
  domain_name = aws_api_gateway_domain_name.gateway-prod.domain_name
}

# ======================================================================================================
# Validators
# ======================================================================================================

resource "aws_api_gateway_request_validator" "validate-query-headers" {
  provider = aws.eu-central-1 
  name                        = "Validate query string parameters"
  rest_api_id                 = aws_api_gateway_rest_api.gateway-prod.id
  validate_request_body       = false
  validate_request_parameters = true
}

resource "aws_api_gateway_request_validator" "validate-body" {
  provider = aws.eu-central-1 
  name                        = "Validate body"
  rest_api_id                 = aws_api_gateway_rest_api.gateway-prod.id
  validate_request_body       = true
  validate_request_parameters = false
}

# ======================================================================================================

# api
resource "aws_api_gateway_resource" "resource-api" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  parent_id   = aws_api_gateway_rest_api.gateway-prod.root_resource_id
  path_part   = "api"
}

# api\authentication
resource "aws_api_gateway_resource" "resource-api-authenticate" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  parent_id   = aws_api_gateway_resource.resource-api.id
  path_part   = "authenticate"
}

# api\authentication\question
resource "aws_api_gateway_resource" "resource-api-authenticate-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  parent_id   = aws_api_gateway_resource.resource-api-authenticate.id
  path_part   = "question"
}

# ======================================================================================================
# GET api\authentication\question
# ======================================================================================================

resource "aws_api_gateway_method" "get-api-authenticate-question" {
  provider = aws.eu-central-1 
  rest_api_id          = aws_api_gateway_rest_api.gateway-prod.id
  resource_id          = aws_api_gateway_resource.resource-api-authenticate-question.id
  http_method          = "GET"
  authorization        = "NONE"
  request_validator_id = aws_api_gateway_request_validator.validate-query-headers.id
  request_parameters   = {
    "method.request.querystring.qtoken" = true
  }
}

resource "aws_api_gateway_method_response" "method-response-get-api-authenticate-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-authenticate-question.id
  http_method = aws_api_gateway_method.get-api-authenticate-question.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "integration-request-get-api-authenticate-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-authenticate-question.resource_id
  http_method = aws_api_gateway_method.get-api-authenticate-question.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_lambda_func.invoke_arn
}

resource "aws_api_gateway_integration_response" "integration-response-get-api-authenticate-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-authenticate-question.resource_id
  http_method = aws_api_gateway_method.get-api-authenticate-question.http_method
  status_code = aws_api_gateway_method_response.method-response-get-api-authenticate-question_200.status_code

 }

resource "aws_lambda_permission" "get-api-authenticate-question-lambda-permission" {
  provider = aws.eu-central-1 
  statement_id  = "AllowAuthenticateQuestionInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_lambda_func.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.gateway-prod.execution_arn}/*/GET/api/authenticate/question"
}

# ======================================================================================================
# OPTIONS api\authentication\question
# ======================================================================================================

resource "aws_api_gateway_method" "options-api-authenticate-question" {
  provider = aws.eu-central-1 
  rest_api_id   = aws_api_gateway_rest_api.gateway-prod.id
  resource_id   = aws_api_gateway_resource.resource-api-authenticate-question.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "method-response-options-api-authenticate-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-authenticate-question.id
  http_method = aws_api_gateway_method.options-api-authenticate-question.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration" "integration-options-api-authenticate-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-authenticate-question.resource_id
  http_method = aws_api_gateway_method.options-api-authenticate-question.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "integration-response-options-api-authenticate-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-authenticate-question.resource_id
  http_method = aws_api_gateway_method.options-api-authenticate-question.http_method
  status_code = aws_api_gateway_method_response.method-response-options-api-authenticate-question_200.status_code
  response_parameters = "${var.integration_response_parameters}"
}

# ======================================================================================================

# api\questionmanager
resource "aws_api_gateway_resource" "resource-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  parent_id   = aws_api_gateway_resource.resource-api.id
  path_part   = "questionmanager"
}


# ======================================================================================================
# POST api\questionmanager
# ======================================================================================================

resource "aws_api_gateway_method" "post-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id          = aws_api_gateway_rest_api.gateway-prod.id
  resource_id          = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method          = "POST"
  authorization        = "NONE"
}

resource "aws_api_gateway_method_response" "method-response-post-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method = aws_api_gateway_method.post-api-questionmanager.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "integration-request-post-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.post-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.post-api-questionmanager.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_lambda_func.invoke_arn
}

resource "aws_api_gateway_integration_response" "integration-response-post-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.post-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.post-api-questionmanager.http_method
  status_code = aws_api_gateway_method_response.method-response-post-api-questionmanager_200.status_code
 }

resource "aws_lambda_permission" "post-api-questionmanager-lambda-permission" {
  provider = aws.eu-central-1 
  statement_id  = "AllowQuestionmanagerPostInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_lambda_func.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.gateway-prod.execution_arn}/*/POST/api/questionmanager"
}


# ======================================================================================================
# GET api\questionmanager
# ======================================================================================================

resource "aws_api_gateway_method" "get-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id          = aws_api_gateway_rest_api.gateway-prod.id
  resource_id          = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method          = "GET"
  authorization        = "AWS_IAM"
  request_validator_id = aws_api_gateway_request_validator.validate-query-headers.id
  request_parameters   = {
    "method.request.querystring.qtoken" = true
    "method.request.querystring.sessionId" = false
  }
}

resource "aws_api_gateway_method_response" "method-response-get-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method = aws_api_gateway_method.get-api-questionmanager.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "integration-request-get-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.get-api-questionmanager.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_lambda_func.invoke_arn
}

resource "aws_api_gateway_integration_response" "integration-response-get-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.get-api-questionmanager.http_method
  status_code = aws_api_gateway_method_response.method-response-get-api-questionmanager_200.status_code
 }

resource "aws_lambda_permission" "get-api-questionmanager-lambda-permission" {
  provider = aws.eu-central-1 
  statement_id  = "AllowQuestionManagerGetInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_lambda_func.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.gateway-prod.execution_arn}/*/GET/api/questionmanager"
}

# ======================================================================================================
# OPTIONS api\questionmanager
# ======================================================================================================

resource "aws_api_gateway_method" "options-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id   = aws_api_gateway_rest_api.gateway-prod.id
  resource_id   = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "method-response-options-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-questionmanager.id
  http_method = aws_api_gateway_method.options-api-questionmanager.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration" "integration-options-api-questionmanager" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.options-api-questionmanager.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "integration-response-options-api-questionmanager_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-questionmanager.resource_id
  http_method = aws_api_gateway_method.options-api-questionmanager.http_method
  status_code = aws_api_gateway_method_response.method-response-options-api-questionmanager_200.status_code
  response_parameters = "${var.integration_response_parameters}"
}

# ======================================================================================================

# api\question
resource "aws_api_gateway_resource" "resource-api-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  parent_id   = aws_api_gateway_resource.resource-api.id
  path_part   = "question"
}


# ======================================================================================================
# GET api\question
# ======================================================================================================

resource "aws_api_gateway_method" "get-api-question" {
  provider = aws.eu-central-1 
  rest_api_id          = aws_api_gateway_rest_api.gateway-prod.id
  resource_id          = aws_api_gateway_resource.resource-api-question.id
  http_method          = "GET"
  authorization        = "AWS_IAM"
  request_validator_id = aws_api_gateway_request_validator.validate-query-headers.id
  request_parameters   = {
    "method.request.querystring.qtoken" = true
  }
}

resource "aws_api_gateway_method_response" "method-response-get-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-question.id
  http_method = aws_api_gateway_method.get-api-question.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "integration-request-get-api-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-question.resource_id
  http_method = aws_api_gateway_method.get-api-question.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_lambda_func.invoke_arn
}

resource "aws_api_gateway_integration_response" "integration-response-get-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.get-api-question.resource_id
  http_method = aws_api_gateway_method.get-api-question.http_method
  status_code = aws_api_gateway_method_response.method-response-get-api-question_200.status_code
 }

resource "aws_lambda_permission" "get-api-question-lambda-permission" {
  provider = aws.eu-central-1 
  statement_id  = "AllowQuestionGetInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_lambda_func.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.gateway-prod.execution_arn}/*/GET/api/question"
}

# ======================================================================================================
# POST api\question
# ======================================================================================================

resource "aws_api_gateway_method" "post-api-question" {
  provider = aws.eu-central-1 
  rest_api_id          = aws_api_gateway_rest_api.gateway-prod.id
  resource_id          = aws_api_gateway_resource.resource-api-question.id
  http_method          = "POST"
  authorization        = "AWS_IAM"
  request_validator_id = aws_api_gateway_request_validator.validate-query-headers.id
  request_parameters   = {
    "method.request.querystring.qtoken" = true
    "method.request.querystring.sessionid" = false
    "method.request.querystring.vote" = true
    "method.request.querystring.name" = true  
  }
}

resource "aws_api_gateway_method_response" "method-response-post-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-question.id
  http_method = aws_api_gateway_method.post-api-question.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "integration-request-post-api-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.post-api-question.resource_id
  http_method = aws_api_gateway_method.post-api-question.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_lambda_func.invoke_arn
}

resource "aws_api_gateway_integration_response" "integration-response-post-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.post-api-question.resource_id
  http_method = aws_api_gateway_method.post-api-question.http_method
  status_code = aws_api_gateway_method_response.method-response-post-api-question_200.status_code
 }

resource "aws_lambda_permission" "post-api-question-lambda-permission" {
  provider = aws.eu-central-1 
  statement_id  = "AllowQuestionPostInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_lambda_func.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.gateway-prod.execution_arn}/*/POST/api/question"
}

# ======================================================================================================
# OPTIONS api\question
# ======================================================================================================

resource "aws_api_gateway_method" "options-api-question" {
  provider = aws.eu-central-1 
  rest_api_id   = aws_api_gateway_rest_api.gateway-prod.id
  resource_id   = aws_api_gateway_resource.resource-api-question.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "method-response-options-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_resource.resource-api-question.id
  http_method = aws_api_gateway_method.options-api-question.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration" "integration-options-api-question" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-question.resource_id
  http_method = aws_api_gateway_method.options-api-question.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "integration-response-options-api-question_200" {
  provider = aws.eu-central-1 
  rest_api_id = aws_api_gateway_rest_api.gateway-prod.id
  resource_id = aws_api_gateway_method.options-api-question.resource_id
  http_method = aws_api_gateway_method.options-api-question.http_method
  status_code = aws_api_gateway_method_response.method-response-options-api-question_200.status_code
  response_parameters = "${var.integration_response_parameters}"
}



# =====================================================================================================================================
# =====================================================================================================================================
#
# Angular website
#
# =====================================================================================================================================
# =====================================================================================================================================

resource "aws_s3_bucket" "angular-website" {
  provider = aws.eu-central-1 
  bucket = "fishtracker-angular-website-prod"

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }
}

resource "aws_s3_bucket_ownership_controls" "angular-website" {
  provider = aws.eu-central-1 
  bucket = aws_s3_bucket.angular-website.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "angular-website" {
  provider = aws.eu-central-1 
  bucket = aws_s3_bucket.angular-website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "angular-website" {
  provider = aws.eu-central-1 
  depends_on = [
    aws_s3_bucket_ownership_controls.angular-website,
    aws_s3_bucket_public_access_block.angular-website,
  ]

  bucket = aws_s3_bucket.angular-website.id
  acl    = "public-read"
}

resource "aws_s3_bucket_website_configuration" "angular-website" {
  provider = aws.eu-central-1 
  bucket = aws_s3_bucket.angular-website.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

# ======================================================================================================
# ======================================================================================================
#
# Route53 - https://www.oss-group.co.nz/blog/automated-certificates-aws
#
# ======================================================================================================
# ======================================================================================================

# This data source looks up the public DNS zone
data "aws_route53_zone" "Public" {
  provider = aws.eu-central-1 
  name         = var.fishtracker_dns_zone
  private_zone = false
}

# Standard route53 DNS record for "web api" pointing to an Gateway
resource "aws_route53_record" "webapi" {
  provider = aws.eu-central-1 
  zone_id = data.aws_route53_zone.Public.zone_id
  name    = "${var.api_dns_name}.${data.aws_route53_zone.Public.name}"
  type    = "A"
  alias {
    zone_id = "${aws_api_gateway_domain_name.gateway-prod.cloudfront_zone_id}"
    name = "${aws_api_gateway_domain_name.gateway-prod.cloudfront_domain_name}"
    evaluate_target_health = false
  }  
}

output "testing" {
  value = "Test this demo code by going to https://${aws_route53_record.webapi.fqdn} and checking your have a valid SSL cert"
}
output "testing_sclient" {
  value = "Test this SSL by using openssl s_client -host ${aws_route53_record.webapi.fqdn} -port 443 and looking at the certs"
}

# Standard route53 DNS record for "website" pointing to an CloudFront
resource "aws_route53_record" "website" {
  provider = aws.eu-central-1 
  zone_id = data.aws_route53_zone.Public.zone_id
  name    = "${var.web_dns_name}.${data.aws_route53_zone.Public.name}"
  type    = "A"
  alias {
    zone_id = "${aws_cloudfront_distribution.angular-website.hosted_zone_id}"
    name = "${aws_cloudfront_distribution.angular-website.domain_name}"
    evaluate_target_health = false
  }  
}


# ======================================================================================================
# ======================================================================================================
#
# CloudFront Web Dist - https://medium.com/@thearaseng/build-s3-static-website-and-cloudfront-using-terraform-and-gitlab-888a8ec1d37d
#
# ======================================================================================================
# ======================================================================================================

locals {
  s3_origin_id   = aws_s3_bucket.angular-website.id
#  s3_domain_name = "${var.s3_name}.s3-website-${var.region}.amazonaws.com"
}

resource "aws_cloudfront_distribution" "angular-website" {
  provider = aws.eu-central-1 
  enabled = true
  aliases = ["${var.web_dns_name}.${data.aws_route53_zone.Public.name}"]
  
  origin {
    origin_id                = local.s3_origin_id
    domain_name              = aws_s3_bucket.angular-website.website_endpoint
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1"]
    }
  }

  default_cache_behavior {
    
    target_origin_id = local.s3_origin_id
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.cert.arn
    ssl_support_method = "sni-only"
  }

  price_class = "PriceClass_100"

  tags = {
    Project = "FishTracker"
    Environment = "Prod"
  }

}