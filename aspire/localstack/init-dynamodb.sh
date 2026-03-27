#!/bin/bash
# Creates DynamoDB tables in LocalStack matching the CDK stack definition.
# This script runs automatically when LocalStack reaches the "ready" state.

ENDPOINT="http://localhost:4566"
REGION="eu-central-1"

echo "Creating DynamoDB tables in LocalStack..."

# FishTracker-Trips-Prod (PK: Subject, SK: TripId)
awslocal dynamodb create-table \
    --table-name FishTracker-Trips-Prod \
    --attribute-definitions \
        AttributeName=Subject,AttributeType=S \
        AttributeName=TripId,AttributeType=S \
    --key-schema \
        AttributeName=Subject,KeyType=HASH \
        AttributeName=TripId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

# FishTracker-Catch-Prod (PK: TripKey, SK: CatchId)
awslocal dynamodb create-table \
    --table-name FishTracker-Catch-Prod \
    --attribute-definitions \
        AttributeName=TripKey,AttributeType=S \
        AttributeName=CatchId,AttributeType=S \
    --key-schema \
        AttributeName=TripKey,KeyType=HASH \
        AttributeName=CatchId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

# FishTracker-Profile-Prod (PK: Subject)
awslocal dynamodb create-table \
    --table-name FishTracker-Profile-Prod \
    --attribute-definitions \
        AttributeName=Subject,AttributeType=S \
    --key-schema \
        AttributeName=Subject,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

# FishTracker-Settings-Prod (PK: Settings)
awslocal dynamodb create-table \
    --table-name FishTracker-Settings-Prod \
    --attribute-definitions \
        AttributeName=Settings,AttributeType=S \
    --key-schema \
        AttributeName=Settings,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"

echo "All DynamoDB tables created successfully."
awslocal dynamodb list-tables --region "$REGION"
