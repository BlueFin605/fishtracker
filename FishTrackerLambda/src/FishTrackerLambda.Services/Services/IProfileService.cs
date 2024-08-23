using System;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface IProfileService
    {
        Task<HttpWrapper<ProfileDetails>> GetProfile(string subject);
        Task<HttpWrapper<ProfileDetails>> UpdateProfile(string subject, ProfileDetails profile);
    }
}

