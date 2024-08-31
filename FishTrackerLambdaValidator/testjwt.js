const { CognitoJwtVerifier } = require("aws-jwt-verify");
const axios = require('axios'); // Add axios for intercepting network requests
const lib = require('./lib');
const common = require('./common.js');

// Verifier configuration
const verifier = CognitoJwtVerifier.create({
    userPoolId: "eu-central-1_mM4RIUG7b",
    tokenUse: "access",
    clientId: "580bdivmu2jc8p09aj8cl8ffid",
    // jwksUri: 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_mM4RIUG7/.well-known/jwks.json'
});

const event = {
    type: 'TOKEN',
    methodArn: 'arn:aws:execute-api:eu-central-1:083148603667:nqof2u3o25/Prod/GET/api/profile',
    authorizationToken: 'Bearer eyJraWQiOiI4M25cL1ZHenlqSUVTVTdBTGZaXC8zMVUzSHFuT1pBYnoxbkhZXC84cG8zT3JjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4M2Y0OTg2Mi04MDExLTcwMmYtNjg5Zi0wODk0M2U5ZWQ3NWQiLCJjb2duaXRvOmdyb3VwcyI6WyJldS1jZW50cmFsLTFfbU00UklVRzdiX0dvb2dsZSJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtY2VudHJhbC0xLmFtYXpvbmF3cy5jb21cL2V1LWNlbnRyYWwtMV9tTTRSSVVHN2IiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiI1ODBiZGl2bXUyamM4cDA5YWo4Y2w4ZmZpZCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3MjUwNTE1NTUsImV4cCI6MTcyNTEzNzk1NSwiaWF0IjoxNzI1MDUxNTU1LCJqdGkiOiI1MWMyOGQ0NC04MmI4LTRjNzgtOWI1YS1hZWVhMmIxNjkwZGQiLCJ1c2VybmFtZSI6Ikdvb2dsZV8xMTI0MzE4OTEwMTAwMjgyMjU4NzcifQ.In02G5lh1mrgFEiu6G7MPDIsLrzIXyVphPNZ3tFdOhObiyAAS1bzQTQ_UCNxhdwqtaWHcP5CcZkLlFQsNsdadQB0wmtKkzIJgW9tqXarHdWUdUFJrDZL7YvGz0aI0GSe4XSNJrt6P4I5Npw9xxlFLQFwV3RL91dwNHxbwVkUiRBhuwp3iwlb2c8zqubQe8GJZwBu271EbIroqtaxgXmre2J-yDyRYulO0pTN2LqR0waqON-qF1_Zeq3hkwL7LY1IRcOXTLfn7-hlDPxUU1sgIr4-Ub1QRDvITFbV9uvnOD2RFB3Gx3QxaYEewUEhgTdCOAD6JSOIvn2O00at8y2khw'
};

async function testToken() {
    try {
        const payload = await verifier.verify(event.authorizationToken.replace("Bearer ", ""));
        console.log("Token is valid. Payload:", payload);
        var data = {
            principalId: payload.sub,
            policyDocument: common.getPolicyDocument('Allow', 'arn:aws:execute-api:eu-central-1:083148603667:nqof2u3o25/Prod/GET/api/settings'),
            context: { scope: payload.scope }
          }
      
    } catch (err) {
        console.log("Token not valid!", err);
    }
}

testToken();