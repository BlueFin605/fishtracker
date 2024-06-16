using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using FishTracker.Models.Lambda;
using FishTracker.Models.Persistance;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTracker.Services
{
    public static class QuestionHelper
    {
        private static string m_tableName = "FishTracker-Results-Prod";

        public static async Task<DynamodbQuestion> AddVote(this Task<DynamodbQuestion> question, string sessionId, VoteType vote, string name, ILogger logger)
        {
            logger.LogInformation($"QuestionHelper::AddVote sessionId[{sessionId}] vote[{vote}] name [{name}] question[{question}]");

            var q = await question;

            //logger.LogInformation($"QuestionHelper::AddVote question[{q}]");

            if (q.Votes.ContainsKey(sessionId))
                q.Votes[sessionId] = new DynamoDbVote(vote, name, sessionId);
            else
                q.Votes.Add(sessionId, new DynamoDbVote(vote, name, sessionId));

            //logger.LogInformation($"QuestionHelper::AddVote log spot A");

            var logdata = JsonConvert.SerializeObject(q, new StringEnumConverter());

            //logger.LogInformation($"QuestionHelper::AddVote new vote[{logdata}]");

            return q;
        }

        public static async Task<DynamodbQuestion> SaveQuestion(this Task<DynamodbQuestion> question, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"QuestionHelper::SaveQuestion");

            var q = await question;

            //logger.LogInformation($"QuestionHelper::SaveQuestion q[{q}]");

            var table = Table.LoadTable(client, m_tableName);

            //logger.LogInformation($"QuestionHelper::SaveQuestion table[{table}]");

            var jsonText = JsonConvert.SerializeObject(q, new StringEnumConverter());

            //logger.LogInformation($"QuestionHelper::SaveQuestion jsonText[{jsonText}]");

            var item = Document.FromJson(jsonText) ?? throw new Exception("Error creating Document[null]");

            //logger.LogInformation($"QuestionHelper::SaveQuestion item[{item}]");

            await table.UpdateItemAsync(item);

            //logger.LogInformation($"QuestionHelper::SaveQuestion q[{q}]");

            return q;
        }

        public static async Task<DynamodbQuestion> GetQuestion(Guid id, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"QuestionHelper::GetQuestion questionId[{id}]");

            var table = Table.LoadTable(client, m_tableName);

            try
            {
                var item = await table.GetItemAsync(id.ToString());
                //logger.LogInformation($"QuestionHelper::GetQuestion GetItemAsync[{item}]");
                if (item == null)
                {
                    logger.LogInformation($"GetQuestion:[{id}] null response - creating empty");
                    return new DynamodbQuestion(id.ToString());
                }

                string jsonText = item.ToJson() ?? throw new Exception($"Unable to convert to Json for table:[{m_tableName}] id:[{id.ToString()}]");

                //logger.LogInformation($"QuestionHelper::GetQuestion jsonText[{jsonText}]");

                return JsonConvert.DeserializeObject<DynamodbQuestion>(jsonText, new StringEnumConverter()) ?? throw new Exception($"Unable to deserialise Json for table:[{m_tableName}] id:[{id.ToString()}]");
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetQuestion:[{id}] ResourceNotFoundException - creating empty");
                return new DynamodbQuestion(id.ToString());
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetQuestion:[{id}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }


        public static async Task<QuestionResults> BuildQuestionResults(this Task<DynamodbQuestion> question, QuestionTokenDetails questionDetails)
        {
            uint fully, endorsement, agree, abstain, standaside, disagreementbutfollow, disagreementleavemeout, nosupport;
            uint entusiastic, lukewarm, meagre, opposed;

            fully = endorsement = agree = abstain = standaside = disagreementbutfollow = disagreementleavemeout = nosupport = entusiastic = lukewarm = meagre = opposed = 0;

            var q = await question;

            foreach (var v in q.Votes)
            {
                {
                    switch (v.Value.Vote)
                    {
                        case VoteType.Fully:
                            fully++;
                            entusiastic++;
                            break;

                        case VoteType.Endorsement:
                            endorsement++;
                            entusiastic++;
                            break;

                        case VoteType.Agree:
                            agree++;
                            lukewarm++;
                            break;


                        case VoteType.Abstain:
                            abstain++;
                            lukewarm++;
                            break;

                        case VoteType.StandAside:
                            standaside++;
                            lukewarm++;
                            break;

                        case VoteType.DisagreementButFollow:
                            disagreementbutfollow++;
                            meagre++;
                            break;

                        case VoteType.DisagreementLeaveMeOut:
                            disagreementleavemeout++;
                            meagre++;
                            break;

                        case VoteType.NoSupport:
                            nosupport++;
                            opposed++;
                            break;
                    }
                }
            }

            AnswerResults answers = new AnswerResults(fully, endorsement, agree, abstain, standaside, disagreementbutfollow, disagreementleavemeout, nosupport);
            GradientResults gradiant = new GradientResults(entusiastic, lukewarm, meagre, opposed);

            var qdets = new QuestionDetails(questionDetails.Id, questionDetails.Question, questionDetails.Notes, questionDetails.Participants, null);
            var results = new QuestionResults(qdets, answers, gradiant);
            return results;
        }

        public static async Task<VoteDetails?> FindScoreForSession(this Task<DynamodbQuestion> question, string sessionId)
        {
            var q = await question;
            DynamoDbVote? vote = q.Votes.Where(q => string.Compare(q.Key, sessionId, StringComparison.OrdinalIgnoreCase) == 0).Select(v => v.Value).FirstOrDefault();
            return vote == null ? null : new VoteDetails(vote.Vote, vote.Name, vote.SessionId);
        }

        //public static async Task<QuestionDetails> ToQuestionDetails(this Task<DynamodbQuestion> question)
        //{
        //    var q = await question;
        //    return new QuestionDetails(q.QuestionId, q.)
        //}

        //public static QuestionDetails AddSessionId(this QuestionTokenDetails question, string sessionId)
        //{
        //    sessionId = TokenGenerator.GenerateSessionId(sessionId);
        //    return new QuestionDetails(question.Id, question.Question, question.Notes, question.Participants, null, sessionId);
        //}

        public static QuestionDetails AddVote(this QuestionTokenDetails question, VoteDetails? vote)
        {
            return new QuestionDetails(question.Id, question.Question, question.Notes, question.Participants, vote);
        }
    }
}

