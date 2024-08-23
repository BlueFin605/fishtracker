using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess;

public static class ProfileDbTable
{
    public static Task<HttpWrapper<DynamoDbProfile>> WriteProfileToDynamoDb(this DynamoDbProfile record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.SaveDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbProfile>> UpdateProfileInDynamodb(this DynamoDbProfile record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.UpdateDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbProfile>> ReadProfileFromDynamodb(String subject, IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecord<DynamoDbProfile, string>(subject, client, logger);
    }

    internal static DynamoDbProfile PatchProfile(this DynamoDbProfile record, ProfileDetails updateProfile)
    {
        var dbProfile = record;

        var c = dbProfile; //.Value;

        return new DynamoDbProfile(c.Subject,
                    updateProfile.timeZone ?? c.Timezone,
                    updateProfile.species ?? c.Species,
                    updateProfile.defaultSpecies ?? c.DefaultSpecies,
                    c.DynamoDbVersion);
    }

    public static ProfileDetails ToProfileDetails(this DynamoDbProfile c)
    {
        return new ProfileDetails(c.Timezone,
                                  c.Species,
                                  c.DefaultSpecies);
    }

    internal static DynamoDbProfile BuildDefault(String subject)
    {
        return new DynamoDbProfile(subject,
                                 null,
                                 new string[0],
                                 string.Empty,
                                 null);
    }
}

