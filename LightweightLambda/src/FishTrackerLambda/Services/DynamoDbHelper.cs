﻿using System.Collections.Concurrent;
using System.Globalization;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using FishTrackerLambda.Models.Persistance;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTrackerLambda.Services
{
    public static class DynamoDbHelper
    {
        public static async Task<T> SaveDynamoDbRecord<T>(this Task<T> record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = await record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);

            return q;
        }

        public static async Task<T> UpdateDynamoDbRecord<T>(this Task<T> record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = await record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);

            return q;
        }

        public static async Task<T> GetDynamoDbRecord<T, P, S>(P part, S sortKey, IAmazonDynamoDB client, ILogger logger, Func<T> initDefault)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecord part[{part}] sort[{sortKey}]");

            try
            {
                var context = new DynamoDBContext(client);
                var record = await context.LoadAsync<T>(part, sortKey);

                if (record == null)
                {
                    logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] null response - creating empty");
                    return initDefault();
                }

                return record;
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

        public static async Task<IEnumerable<T>> GetDynamoDbRecords<T, P>(P part, string partKeyName, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecords part[{part}]");

            try
            {
                var context = new DynamoDBContext(client);
                var query = context.QueryAsync<T>(part /*queryOptions*/);
                var items = await query.GetRemainingAsync();
                return items;
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

