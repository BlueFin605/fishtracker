const { CognitoJwtVerifier } = require("aws-jwt-verify");
const common = require('./common.js');

// Derive pool id from TOKEN_ISSUER (format: https://cognito-idp.<region>.amazonaws.com/<poolId>).
// AUDIENCE is the auth-code client id. Both are set by the CDK's ValidatorLambda
// Environment block; failing fast on missing env catches regressions loudly.
const tokenIssuer = process.env.TOKEN_ISSUER;
const audience = process.env.AUDIENCE;
if (!tokenIssuer || !audience) {
  throw new Error("ValidatorLambda requires TOKEN_ISSUER and AUDIENCE environment variables");
}
const userPoolId = tokenIssuer.substring(tokenIssuer.lastIndexOf('/') + 1);

const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: "access",
  clientId: audience,
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
    console.log(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log('error', error);
    return context.fail("Unauthorized");    
  }
};