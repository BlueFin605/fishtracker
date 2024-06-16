using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using GradientOfAgreementLambda.Models.Lambda;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace GradientOfAgreementLambda.Services
{
    public static class TokenGenerator
    {
        private static string mySecret = "bmnrj!M6qT6XEGDh6r6cK3nXmktGmb6YbHp?q?jD";
        private static SymmetricSecurityKey mySecurityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(mySecret));

        public static string GenerateToken(QuestionTokenDetails request)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor()
            {
                Expires = DateTime.UtcNow.AddYears(1),
                SigningCredentials = new SigningCredentials(mySecurityKey, SecurityAlgorithms.HmacSha256Signature),
                Claims = ToMyDictionary(request)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public static QuestionTokenDetails SplitToken(string tokenString)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken secToken;
            var tokenParams = new TokenValidationParameters();
            tokenParams.IssuerSigningKey = mySecurityKey;
            tokenParams.ValidateAudience = false;
            tokenParams.ValidateIssuer = false;
            var jwttoken = tokenHandler.ValidateToken(tokenString, tokenParams, out secToken);
            return new QuestionTokenDetails(
                Guid.Parse(jwttoken.Claims.First(c => c.Type == "Id").Value),
                jwttoken.Claims.First(c => c.Type == "Question").Value,
                jwttoken.Claims.First(c => c.Type == "Notes").Value,
                new List<PersonRequest>(),
                jwttoken.Claims.First(c => c.Type == "OwnerSessionId").Value
            );
        }

        private static IDictionary<string, object> ToMyDictionary(object obj)
        {
            var json = JsonConvert.SerializeObject(obj);
            var dictionary = JsonConvert.DeserializeObject<Dictionary<string, object>>(json);
            return dictionary ?? new Dictionary<string, object>();
        }

        public static string GenerateSessionId(string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                sessionId = Guid.NewGuid().ToString();

            return sessionId;
        }
    }

}

