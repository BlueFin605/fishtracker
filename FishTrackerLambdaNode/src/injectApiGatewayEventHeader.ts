import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, APIGatewayEventRequestContextWithAuthorizer, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import express, { NextFunction, Request, Response } from 'express';

const injectApiGatewayEventHeader = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers['x-apigateway-event']) {
        const context: APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext> = {
            accountId: '',
            apiId: '',
            // authorizer: {
            //     claims: [
            //         { Type: 'principalId', Value: 'user123' }
            //     ]
            // },
            "authorizer": {
                "scope": "aws.cognito.signin.user.admin openid profile email",
                "principalId": "user123",
                "integrationLatency": 46
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
        };
        req.headers['x-apigateway-event'] = JSON.stringify(context);
    }
    next();
};

export default injectApiGatewayEventHeader;