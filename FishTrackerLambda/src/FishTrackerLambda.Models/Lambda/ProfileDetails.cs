using System;
namespace FishTrackerLambda.Models.Lambda
{
    public record class ProfileDetails(String? timeZone,
                                String[]? species,
                                String? defaultSpecies);
}

