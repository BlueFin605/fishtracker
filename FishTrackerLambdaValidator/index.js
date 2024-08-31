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
    console.log('missing token');
    return callback("Unauthorized");   // Return a 401 Unauthorized response
  }

  try {
    console.log(token);
    const payload = await verifier.verify(token);
    console.log('verfied okay', payload);
    return callback(null, generatePolicy('user', 'Allow', event.methodArn));
  } catch (error) {
    console.log('error', error);
    return callback("Unauthorized");   // Return a 401 Unauthorized response   
  }
};