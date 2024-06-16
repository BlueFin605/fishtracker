using System;
using GradientOfAgreementLambda.Models.Lambda;

namespace GradientOfAgreementLambda.Models.Persistance
{
    public class DynamodbQuestion
	{
		public string? QuestionId { get; set; }

		public IDictionary<string, DynamoDbVote> Votes { get; set; }

        public DynamodbQuestion()
		{
			Votes = new Dictionary<string, DynamoDbVote>();
        }

        public DynamodbQuestion(string id)
        {
            QuestionId = id;

            Votes = new Dictionary<string, DynamoDbVote>();
        }
    }
}

