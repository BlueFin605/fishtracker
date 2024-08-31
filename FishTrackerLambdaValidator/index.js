const { CognitoJwtVerifier } = require("aws-jwt-verify");
const common = require('./common.js');

// Initialize the Cognito JWT Verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: "eu-central-1_mM4RIUG7b",
  tokenUse: "access",
  clientId: "580bdivmu2jc8p09aj8cl8ffid",
});

// Lambda function index.handler - AWS API Gateway custom validator of JWT token
module.exports.handler = async (event, context, callback) => {
  console.log('event', event);
  console.log('context', context);

  const token = event.authorizationToken;

  if (!token) {
    console.log('missing token');
    return callback("Unauthorized");   // Return a 401 Unauthorized response
  }

  try {
    console.log(token);
    const payload = await verifier.verify(token.replace("Bearer ", ""));
    console.log('verfied okay', payload);
    var data = {
      principalId: payload.sub,
      policyDocument: common.getPolicyDocument('Allow', event.methodArn),
      context: { scope: payload.scope }
    }
    return data;
  } catch (error) {
    console.log('error', error);
    return context.fail("Unauthorized");    
  }
};