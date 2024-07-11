
using System.Security.Claims;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;

public static class MapHttpRoutes
{
    public static void MapRoutes(this WebApplication app)
    {
        app.MapGet("/", () => "Welcome to running ASP.NET Core Minimal API on AWS Lambda");

        app.MapGet("api/trip/", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetAllTrips tripId subject:[{subjectClaim}]", async () => await tripService.GetTrips(subjectClaim));
        });

        app.MapGet("api/trip/{tripId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.GetTrip(subjectClaim, tripId));
        });

        app.MapPost("api/trip", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, NewTrip newTrip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"NewTrip tripId:[{subjectClaim}]", async () => await tripService.NewTrip(subjectClaim, newTrip));
        });
    }

    private static async Task<IResult> ExecuteService<T>(ILogger logger, string logDesc, Func<Task<T>> func)
    {
        try
        {
            logger.LogInformation(logDesc);
            var result = await func();
            return Results.Ok(result);
        }
        catch (Exception e)
        {
            logger.LogError(e, $"{logDesc} Exception {e.Message}");
            throw;
        }
    }
}

