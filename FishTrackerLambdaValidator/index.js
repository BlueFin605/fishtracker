const { CognitoJwtVerifier } = require("aws-jwt-verify");
const lib = require('./lib');
let data;

// Lambda function index.handler - thin wrapper around lib.authenticate
module.exports.handler = async (event, context, callback) => {
    // Extract the token from the Authorization header
    console.log(`event:[${JSON.stringify(event)}]`);
    console.log(`context:[${JSON.stringify(context)}]`);
    
    const token = event.headers.Authorization || event.headers.authorization;

    console.log(`token:[${token}]`);
    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized" }),
        };
    }

    // Verifier that expects valid access tokens:
    const verifier = CognitoJwtVerifier.create({
        userPoolId: "eu-central-1_mM4RIUG7b",
        tokenUse: "access",
        clientId: "580bdivmu2jc8p09aj8cl8ffid",
    });

    try {
        const payload = await verifier.verify(token.replace("Bearer ", ""));
        console.log("Token is valid. Payload:", payload);
    } catch (err) {
        console.log("Token not valid!", err);
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized" }),
        };
    }

    // Continue with your logic
    try {
        data = await lib.authenticate(event);
        console.log(data);
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (err) {
        console.log("Error authenticating", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};