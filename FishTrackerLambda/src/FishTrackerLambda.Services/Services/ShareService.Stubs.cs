using FishTrackerLambda.Functional;
using FishTrackerLambda.Services.Http;

namespace FishTrackerLambda.Services
{
    // Temporary stub so the interface compiles; real implementation lands in task 3.9.
    public partial class ShareService
    {
        public Task<HttpWrapper<Unit>> RevokeShare(string ownerSubject, string shareId)
        {
            return Task.FromResult(
                HttpWrapper<Unit>.FromResult(Results.StatusCodeResult(501)));
        }
    }
}
