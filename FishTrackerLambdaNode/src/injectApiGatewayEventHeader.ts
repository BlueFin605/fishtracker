import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import express, { NextFunction, Request, Response } from 'express';

const injectApiGatewayEventHeader = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers['x-apigateway-event']) {
        const event: APIGatewayProxyEvent = {
            httpMethod: req.method,
            path: req.path,
            headers: Object.fromEntries(Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])),
            multiValueHeaders: {},
            queryStringParameters: Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])),
            multiValueQueryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            requestContext: {
                accountId: '',
                apiId: '',
                authorizer: {
                    // claims: [
                    //     { Type: 'principalId', Value: 'user123' }
                    // ]
                    scope: "aws.cognito.signin.user.admin openid profile email",
                    principalId: "user123",
                    integrationLatency: 46
                },
                protocol: '',
                httpMethod: req.method,
                identity: {
                    accessKey: null,
                    accountId: null,
                    apiKey: null,
                    apiKeyId: null,
                    caller: null,
                    clientCert: null,
                    cognitoAuthenticationProvider: null,
                    cognitoAuthenticationType: null,
                    cognitoIdentityId: null,
                    cognitoIdentityPoolId: null,
                    principalOrgId: null,
                    sourceIp: req.ip || '',
                    user: null,
                    userAgent: req.get('User-Agent') || '',
                    userArn: null
                },
                path: req.path,
                requestId: '',
                requestTimeEpoch: 0,
                resourceId: '',
                resourcePath: '',
                stage: ''
            },
            resource: '',
            body: req.body ? JSON.stringify(req.body) : null,
            isBase64Encoded: false
        };
        req.headers['x-apigateway-event'] = JSON.stringify(event);
    }
    next();
};

export default injectApiGatewayEventHeader;