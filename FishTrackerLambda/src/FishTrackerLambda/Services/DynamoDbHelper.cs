using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using FishTrackerLambda.Models.Persistance;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTrackerLambda.Services
{
    public static class DynamoDbHelper
    {
        public static async Task<T> SaveDynamoDbRecord<T>(this Task<T> record, IAmazonDynamoDB client, string tableName, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = await record;

            var table = Table.LoadTable(client, tableName);

            var jsonText = JsonConvert.SerializeObject(q, new StringEnumConverter());

            var item = Document.FromJson(jsonText) ?? throw new Exception("Error creating Document[null]");

            await table.UpdateItemAsync(item);

            return q;
        }

        public static async Task<T> GetDynamoDbRecord<T>(Guid id, IAmazonDynamoDB client, string tableName, ILogger logger, Func<T> initDefault)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecord id[{id}]");

            var table = Table.LoadTable(client, tableName);

            try
            {
                var item = await table.GetItemAsync(id.ToString());
                if (item == null)
                {
                    logger.LogInformation($"GetDynamoDbRecord:[{id}] null response - creating empty");
                    return initDefault();
                }

                string jsonText = item.ToJson() ?? throw new Exception($"Unable to convert to Json for table:[{tableName}] id:[{id.ToString()}]");

                return JsonConvert.DeserializeObject<T>(jsonText, new StringEnumConverter()) ?? throw new Exception($"Unable to deserialise Json for table:[{tableName}] id:[{id.ToString()}]");
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecord:[{id}] ResourceNotFoundException - creating empty");
                return initDefault();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecord:[{id}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }
    }
}

