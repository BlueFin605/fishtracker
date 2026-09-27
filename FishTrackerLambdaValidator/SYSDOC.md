# API Gateway Authorizer — FishTracker

What this is: a Lambda used by API Gateway as a `TOKEN` custom authorizer
(see `infrastructure/FishTrackerStack.cs`, `ValidatorLambda` /
`CustomAuthorizer`). It validates the RS256 JWT issued by FishTracker's
Cognito user pool (`TOKEN_ISSUER` / `AUDIENCE` env vars, set by CDK) before
API Gateway invokes the backend API Lambda.

Built with: Node.js, `aws-jwt-verify` / `jsonwebtoken` / `jwks-rsa`. Started
from the generic `auth0-samples/lambda-jwt-rsa-authorizer` template — the
Auth0-specific framing in `README.md` is template boilerplate; in this repo
the token issuer is Cognito, not Auth0.

## Where things are

- `index.js` — Lambda handler.
- `lib.js` — JWT verification against the JWKS endpoint.
- `common.js` — shared helpers.

## Running / using this area

Local setup, testing (`npm test` via `lambda-local`), and bundling
(`npm run bundle`) are covered in `README.md`. In this repo the bundle is
instead packaged straight from source by the CDK stack
(`Code.FromAsset("../FishTrackerLambdaValidator", ...)`) — the manual
`custom-authorizer.zip` / AWS Console steps in the README don't apply to
the deployed path.
