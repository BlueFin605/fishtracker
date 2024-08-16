using System;
namespace FishTrackerLambda.Helpers
{
	public static class DateConverter
	{
		public static string IsoToString(DateTimeOffset offet)
		{
			return offet.ToString("0");
		}

		public static DateTimeOffset IsoFromString(string offset)
		{
			return DateTimeOffset.Parse(offset);
		}

        internal static DateTimeOffset GetLocalNow(string? timeZone)
        {
			DateTimeOffset timenow;
			if (string.IsNullOrEmpty(timeZone))
			{
				timenow = DateTimeOffset.Now;
			}
			else
			{
				TimeZoneInfo timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
				timenow = TimeZoneInfo.ConvertTime(DateTimeOffset.Now, timeZoneInfo);
			}
			return timenow;
        }
    }
}

