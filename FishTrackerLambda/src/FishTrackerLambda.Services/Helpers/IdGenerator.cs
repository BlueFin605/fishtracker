using System;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Helpers
{
	public static class IdGenerator
	{
        public static String GenerateTripId(DateTimeOffset start)
        {
            return start.DateTime.ToString("MMdd:HHmmss-yy");
        }

        public static String GenerateTripKey(string subject, string tripId)
        {
            return "s:" + subject + ";i:" + tripId;
        }
    }
}

