using System.Collections.Concurrent;
using System.Globalization;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Persistance;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTrackerLambda.Services
{
    public static class DynamoDbHelper
    {
        public static async Task<HttpWrapper<T>> SaveDynamoDbRecord<T>(this T record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);
            return HttpWrapper<T>.Ok(q);
        }

        public static async Task<HttpWrapper<T>> UpdateDynamoDbRecord<T>(this T record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);

            return HttpWrapper<T>.Ok(q);
        }

        public static async Task<HttpWrapper<T>> GetDynamoDbRecord<T, P, S>(P part, S sortKey, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecord part[{part}] sort[{sortKey}]");

            try
            {
                var context = new DynamoDBContext(client);
                var record = await context.LoadAsync<T>(part, sortKey);

                if (record == null)
                {
                    logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] null response - creating empty");
                    return HttpWrapper<T>.NotFound;
                }

                return HttpWrapper<T>.Ok(record);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] ResourceNotFoundException - creating empty");
                return HttpWrapper<T>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecord:[{part}][{sortKey}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }

        public static async Task<HttpWrapper<IEnumerable<T>>> GetDynamoDbRecords<T, P>(P part, string partKeyName, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecords part[{part}]");

            try
            {
                var context = new DynamoDBContext(client);
                var query = context.QueryAsync<T>(part /*queryOptions*/);
                var items = await query.GetRemainingAsync();
                return HttpWrapper<IEnumerable<T>>.Ok(items);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecords:[{part}] ResourceNotFoundException - creating empty");
                return HttpWrapper<IEnumerable<T>>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecords:[{part}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }
    }
}

