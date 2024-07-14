
using System.Security.Claims;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;

public static class MapHttpRoutes
{
    public static void MapRoutes(this WebApplication app)
    {
        app.MapGet("/", () => "Welcome to running ASP.NET Core Minimal API on AWS Lambda");

        app.MapGet("api/trip/", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteServiceOld(app.Logger, $"GetAllTrips tripId subject:[{subjectClaim}]", async () => await tripService.GetTrips(subjectClaim));
        });

        app.MapGet("api/trip/{tripId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteService(app.Logger, $"GetTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.GetTrip(subjectClaim, tripId));
        });

        app.MapPost("api/trip", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, NewTrip newTrip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteServiceOld(app.Logger, $"NewTrip tripId:[{subjectClaim}]", async () => await tripService.NewTrip(subjectClaim, newTrip));
        });

        app.MapPut("api/trip/{tripId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, TripDetails trip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteServiceOld(app.Logger, $"UpdateTrip tripId:[{subjectClaim}][{tripId}]", async () =>
            {
                if (trip.tripId != tripId)
                    throw new Exception($"Cannot change tripId from[{trip.tripId}] to[{tripId}]");

                return await tripService.UpdateTrip(subjectClaim, trip);
            });
        });

        app.MapPatch("api/trip/{tripId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, UpdateTripDetails trip) =>
        {
            string subjectClaim = claimHandler.ExtractSubject(user.Claims);
            return await ExecuteServiceOld(app.Logger, $"PatchTrip tripId:[{subjectClaim}][{tripId}]", async () => await tripService.PatchTrip(subjectClaim, tripId, trip));
        });

        app.MapGet("api/trip/{tripId}/catch", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId) =>
        {
            return await ExecuteServiceOld(app.Logger, $"GetTripCatch tripId:[{tripId}]", async () => await catchService.GetTripCatch(tripId));
        });

        app.MapGet("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, Guid catchId) =>
        {
            return await ExecuteService(app.Logger, $"GetCatch tripId:[{tripId}] catchId:[${catchId}]", async () => await catchService.GetCatch(tripId, catchId));
        });

        app.MapPost("api/trip/{tripId}/catch", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, NewCatch newCatch) =>
        {
            return await ExecuteServiceOld(app.Logger, $"NewCatch tripId:[{tripId}]", async () => await catchService.NewCatch(tripId, newCatch));
        });

        app.MapPut("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, Guid catchId, CatchDetails updateCatch) =>
        {
            return await ExecuteServiceOld(app.Logger, $"UpdateCatch tripId:[{tripId}] catchId:[${catchId}]", async () =>
            {
                if (updateCatch.tripId != tripId)
                    throw new Exception($"Cannot change tripId from[{updateCatch.tripId}] to[{tripId}]");

                if (updateCatch.catchId != catchId)
                    throw new Exception($"Cannot change catchId from[{updateCatch.tripId}] to[{tripId}]");

                return await catchService.UpdateCatch(updateCatch);
            });
        });


        app.MapPatch("api/trip/{tripId}/catch/{catchId}", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user, string tripId, Guid catchId, UpdateCatchDetails updateCatch) =>
        {
            return await ExecuteServiceOld(app.Logger, $"PatchCatch tripId:[{tripId}] catchId:[${catchId}]", async () => await catchService.PatchCatch(tripId, catchId, updateCatch));
        });
    }

    private static async Task<IResult> ExecuteServiceOld<T>(ILogger logger, string logDesc, Func<Task<T>> func)
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
    private static async Task<IResult> ExecuteService<T>(ILogger logger, string logDesc, Func<Task<HttpWrapper<T>>> func)
    {
        try
        {
            logger.LogInformation(logDesc);
            var result = await func();
            return result.Result;
            //var hr = result.Result;
            //return hr;
        }
        catch (Exception e)
        {
            logger.LogError(e, $"{logDesc} Exception {e.Message}");
            throw;
        }
    }
}

