using System.Collections.Concurrent;
using System.Globalization;
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

        public static async Task<T> GetDynamoDbRecord<T,P,S>(P part, S sortKey, IAmazonDynamoDB client, string tableName, ILogger logger, Func<T> initDefault)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecord part[{part}] sort[{sortKey}]");

            var table = Table.LoadTable(client, tableName);

            try
            {
                var item = await table.GetItemAsync(part?.ToString(), sortKey?.ToString());
                if (item == null)
                {
                    logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] null response - creating empty");
                    return initDefault();
                }

                string jsonText = item.ToJson() ?? throw new Exception($"Unable to convert to Json for table:[{tableName}] part:[{part}] sort[{sortKey}]");

                return JsonConvert.DeserializeObject<T>(jsonText, new StringEnumConverter()) ?? throw new Exception($"Unable to deserialise Json for table:[{tableName}] part:[{part}] sort[{sortKey}]");
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] ResourceNotFoundException - creating empty");
                return initDefault();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecord:[{part}][{sortKey}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }

        public static async Task<IEnumerable<T>> GetDynamoDbRecords<T, P>(P part, string partKeyName, IAmazonDynamoDB client, string tableName, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecords part[{part}]");

            var table = Table.LoadTable(client, tableName);

            try
            {
                var queryFilter = new QueryFilter(partKeyName, QueryOperator.Equal, part?.ToString());
                var queryOptions = new QueryOperationConfig
                {
                    Filter = queryFilter
                };

                var items = await table.Query(queryOptions).GetRemainingAsync();

                return items.Select( i => {
                    return JsonConvert.DeserializeObject<T>(i.ToJson(), new StringEnumConverter()) ?? throw new Exception($"Unable to deserialise Json for table:[{tableName}] part:[{part}]");
                });
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecords:[{part}] ResourceNotFoundException - creating empty");
                return new List<T>();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecords:[{part}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }
    }
}

