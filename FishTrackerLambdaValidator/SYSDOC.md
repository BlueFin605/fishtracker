# API Gateway Authorizer — FishTracker

What this is: a Lambda used by API Gateway as a `TOKEN` custom authorizer
(`ValidatorLambda` and `CustomAuthorizer` in
`infrastructure/FishTracker.Cdk/FishTrackerStack.cs`). For each request it
verifies the Cognito-issued access token and returns an allow policy, before
API Gateway invokes the API Lambda.

Built with: Node.js and `aws-jwt-verify`. Started from the generic
`auth0-samples/lambda-jwt-rsa-authorizer` template, so the Auth0 framing in
`README.md` is template boilerplate. In this repo the token issuer is Cognito,
not Auth0.

## What the deployed handler checks

The deployed handler is `index.js`. It uses `aws-jwt-verify`
(`CognitoJwtVerifier`) with:

- **Pool**: the pool id is parsed from `TOKEN_ISSUER`
  (`https://cognito-idp.<region>.amazonaws.com/<pool-id>`).
- **Token type**: access tokens only (`tokenUse: "access"`). ID tokens are rejected.
- **Client**: `clientId` = `AUDIENCE`, the auth-code app client. Access tokens
  issued to any other client are rejected.
- **Success**: returns `principalId` = the token's `sub` and `context.scope` =
  its `scope`, with an Allow policy on `methodArn`. The API Lambda reads the
  `principalId` as the caller's subject.
- **Failure**: a missing token or a failed verification returns `Unauthorized`.

The CDK sets `TOKEN_ISSUER` and `AUDIENCE`. The module throws at load time if
either is missing.

## Where things are

- `index.js` — the deployed Lambda handler (see above).
- `common.js` — policy helper (`getPolicyDocument`) used by `index.js`.
- `lib.js` — **legacy, not used by the deployed path.** An earlier verifier built
  on `jsonwebtoken` and `jwks-rsa` that requires `token_use=id`. `index.js` does
  not require it. Do not describe it as current behaviour.
- `test/lib.test.js` — `npm run test:unit` tests `lib.js` only.

## Running / using this area

- Local setup, testing (`npm test` via `lambda-local`) and bundling
  (`npm run bundle`) are covered in `README.md`.
- The README's manual `custom-authorizer.zip` and AWS Console steps don't apply
  here. The CDK packages this folder straight from source
  (`Code.FromAsset("../FishTrackerLambdaValidator", ...)`).
- `jsonwebtoken` and `jwks-rsa` are used only by the legacy `lib.js`.
