using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess;

public static class SettingsDbTable
{
    public static Task<HttpWrapper<DynamoDbSettings>> WriteSettingsToDynamoDb(this DynamoDbSettings record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.SaveDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbSettings>> UpdateSettingsInDynamodb(this DynamoDbSettings record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.UpdateDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbSettings>> ReadSettingsFromDynamodb(IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecord<DynamoDbSettings, string>("global", client, logger);
    }

    internal static DynamoDbSettings PatchSettings(this DynamoDbSettings record, SettingsDetails updateSettings)
    {
        var dbSettings = record;

        var c = dbSettings; //.Value;

        return new DynamoDbSettings("global",
                    updateSettings.species ?? c.Species,
                    c.DynamoDbVersion);
    }

    public static SettingsDetails ToSettingsDetails(this DynamoDbSettings c)
    {
        return new SettingsDetails(c.Species);
    }

    internal static DynamoDbSettings BuildDefault()
    {
        return new DynamoDbSettings("global",
                                 new string[0],
                                 null);
    }
}

