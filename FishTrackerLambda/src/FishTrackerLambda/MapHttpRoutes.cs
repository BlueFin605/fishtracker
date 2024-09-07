
using System.Security.Claims;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.Services;

public static class MapHttpRoutes
{
    public static void myfunc(ILogger logger) {
        var mres = Results.BadRequest();
    }

    public static void MapRoutes(this WebApplication app)
    {
        app.MapGet("/", () => "Welcome to running ASP.NET Core Minimal API on AWS Lambda");

        app.MapGet("api/profile", async (IClaimHandler claimHandler, IProfileService profileService, ClaimsPrincipal user) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetPropfile subject:[{subjectClaim}]", async () => await profileService.GetProfile(subjectClaim));
        });

        app.MapPatch("api/profile", async (IClaimHandler claimHandler, IProfileService profileService, ClaimsPrincipal user, ProfileDetails profile) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"UpdatePropfile subject:[{subjectClaim}]", async () => await profileService.UpdateProfile(subjectClaim, profile));
        });

        app.MapGet("api/settings", async (IClaimHandler claimHandler, ISettingsService settingsService, ClaimsPrincipal user) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetSettings subject:[{subjectClaim}]", async () => await settingsService.GetSettings());
        });

        app.MapPatch("api/settings", async (IClaimHandler claimHandler, ISettingsService settingsService, ClaimsPrincipal user, SettingsDetails settings) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"UpdateSettings subject:[{subjectClaim}]", async () => await settingsService.UpdateSettings(settings));
        });

        app.MapGet("api/trip/", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string? view) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetAllTrips tripId subject:[{subjectClaim}] view:[{view}]", async () => await tripService.GetTrips(subjectClaim, view));
        });

        app.MapGet("api/trip/{tripId}", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string tripId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.GetTrip(subjectClaim, tripId));
        });

        app.MapDelete("api/trip/{tripId}", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string tripId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"DeleteTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.DeleteTrip(subjectClaim, tripId));
        });

        app.MapPost("api/trip", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, NewTrip newTrip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"NewTrip tripId:[{subjectClaim}]", async () => await tripService.NewTrip(subjectClaim, newTrip));
        });

        app.MapPut("api/trip/{tripId}", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string tripId, TripDetails trip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"UpdateTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.UpdateTrip(subjectClaim, tripId, trip));
        });

        app.MapPatch("api/trip/{tripId}", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string tripId, UpdateTripDetails trip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"PatchTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.PatchTrip(subjectClaim, tripId, trip));
        });

        app.MapPost("api/trip/{tripId}/endtrip", async (IClaimHandler claimHandler, ITripService tripService, ClaimsPrincipal user, string tripId, EndTripDetails trip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"PatchTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.EndTrip(subjectClaim, tripId, trip));
        });


        app.MapGet("api/trip/{tripId}/catch", async (IClaimHandler claimHandler, ICatchService catchService, ClaimsPrincipal user, string tripId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetTripCatch tripId:[{tripId}]", async () => await catchService.GetTripCatch(subjectClaim, tripId));
        });

        app.MapGet("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ClaimsPrincipal user, string tripId, Guid catchId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetCatch tripId:[{tripId}] catchId:[${catchId}]", async () => await catchService.GetCatch(subjectClaim, tripId, catchId));
        });

        app.MapPost("api/trip/{tripId}/catch", async (IClaimHandler claimHandler, ICatchService catchService, ClaimsPrincipal user, string tripId, NewCatch newCatch) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);

            return await ExecuteService(app.Logger, $"NewCatch tripId:[{tripId}]", async () => await catchService.NewCatch(subjectClaim, tripId, newCatch));
        });

        app.MapPut("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ClaimsPrincipal user, string tripId, Guid catchId, CatchDetails updateCatch) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"UpdateCatch tripId:[{tripId}] catchId:[${catchId}]", async () => await catchService.UpdateCatch(subjectClaim, tripId, catchId, updateCatch));
        });

        app.MapPatch("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ClaimsPrincipal user, string tripId, Guid catchId, UpdateCatchDetails updateCatch) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"PatchCatch tripId:[{tripId}] catchId:[${catchId}]", async () => await catchService.PatchCatch(subjectClaim, tripId, catchId, updateCatch));
        });
    }

    private static async Task<IResult> ExecuteService<T>(ILogger logger, string logDesc, Func<Task<HttpWrapper<T>>> func)
    {
        try
        {
            logger.LogInformation(logDesc);
            var result = await func();
            var httpResult = result.Result;
            if (httpResult.StatusCode == 200)
                return Results.Ok(httpResult.Object);
            else
                return Results.StatusCode(httpResult.StatusCode);
        }
        catch (Exception e)
        {
            logger.LogError(e, $"{logDesc} Exception {e.Message}");
            throw;
        }
    }
}

