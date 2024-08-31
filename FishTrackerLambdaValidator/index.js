const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Initialize the Cognito JWT Verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: "eu-central-1_mM4RIUG7b",
  tokenUse: "access",
  clientId: "580bdivmu2jc8p09aj8cl8ffid",
});

// Lambda function index.handler - AWS API Gateway custom validator of JWT token
module.exports.handler = async (event, context, callback) => {
    const token = event.authorizationToken;

    if (!token) {
        return callback(null, {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized: No token provided" })
        });
    }

    try {
        const payload = await verifier.verify(token);
        return callback(null, {
            statusCode: 200,
            body: JSON.stringify({ message: "Token is valid", payload })
        });
    } catch (error) {
        return callback(null, {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized: Invalid token", error: error.message })
        });
    }
};