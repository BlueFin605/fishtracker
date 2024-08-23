using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-Settings-Prod")]
    public class DynamoDbSettings
    {
        [DynamoDBHashKey]   //Partition key
        public string Settings { get; set; }

        public string[] Species { get; set; }

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        [JsonConstructor]
        public DynamoDbSettings(string settings, string[] species, int? dynamoDbVersion)
        {
            Settings = settings;
            Species = species;
            DynamoDbVersion = dynamoDbVersion;
        }

        public DynamoDbSettings()
        {
            Settings = string.Empty;
            Species = new String[0];
        }

    }

}
