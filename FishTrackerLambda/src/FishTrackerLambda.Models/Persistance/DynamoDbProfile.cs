using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-Profile-Prod")]
    public class DynamoDbProfile
    {
        [DynamoDBHashKey]   //Partition key
        public string Subject { get; set; }

        public string? Timezone { get; set; }

        public string[] Species { get; set; }

        public string DefaultSpecies { get; set; }

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        [JsonConstructor]
        public DynamoDbProfile(string subject, string? timezone, string[] species, string defaultSpecies, int? dynamoDbVersion)
        {
            Subject = subject;
            Timezone = timezone;
            Species = species;
            DefaultSpecies = defaultSpecies;
            DynamoDbVersion = dynamoDbVersion;
        }

        public DynamoDbProfile()
        {
            Subject = string.Empty;
            Timezone = null;
            Species = new String[0];
            DefaultSpecies = string.Empty;
        }

    }

}
