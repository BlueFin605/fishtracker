const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const ISSUER = 'https://cognito-idp.ap-southeast-2.amazonaws.com/test-pool';
const AUDIENCE = 'client-abc';
process.env.AUDIENCE = AUDIENCE;
process.env.TOKEN_ISSUER = ISSUER;
process.env.JWKS_URI = 'http://localhost/unused';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Stub the JWKS lookup: jwks-rsa returns a client whose getSigningKey yields our public key.
const jwksPath = require.resolve('jwks-rsa');
require.cache[jwksPath] = {
    id: jwksPath, filename: jwksPath, loaded: true,
    exports: () => ({ getSigningKey: (kid, cb) => cb(null, { publicKey }) }),
};

const lib = require(path.join(__dirname, '..', 'lib.js'));

const sign = (claims) => jwt.sign(
    { sub: 'user-1', iss: ISSUER, aud: AUDIENCE, ...claims },
    privateKey, { algorithm: 'RS256', keyid: 'k1' });
const event = (token) => ({ type: 'TOKEN', authorizationToken: `Bearer ${token}`, methodArn: 'arn:aws:execute-api:x:y:z/Prod/GET/api' });

test('valid id token is allowed', async () => {
    const r = await lib.authenticate(event(sign({ token_use: 'id' })));
    assert.strictEqual(r.principalId, 'user-1');
    assert.strictEqual(r.policyDocument.Statement[0].Effect, 'Allow');
});

test('wrong audience is denied', async () => {
    await assert.rejects(lib.authenticate(event(sign({ token_use: 'id', aud: 'other-client' }))));
});

test('access token (token_use=access) is denied', async () => {
    await assert.rejects(lib.authenticate(event(sign({ token_use: 'access' }))), /token_use/);
});

test('token without token_use is denied', async () => {
    await assert.rejects(lib.authenticate(event(sign({}))), /token_use/);
});
