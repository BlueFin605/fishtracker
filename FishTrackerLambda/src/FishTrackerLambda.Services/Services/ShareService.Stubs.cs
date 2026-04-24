using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services.Http;

namespace FishTrackerLambda.Services
{
    // Temporary stubs so the interface compiles; real implementations land in
    // tasks 3.7 (GetShares), 3.8 (GetShare), and 3.9 (RevokeShare).
    public partial class ShareService
    {
        public Task<HttpWrapper<IEnumerable<ShareSummary>>> GetShares(
            string subject, string verifiedEmail, string direction)
        {
            return Task.FromResult(
                HttpWrapper<IEnumerable<ShareSummary>>.FromResult(Results.StatusCodeResult(501)));
        }

        public Task<HttpWrapper<ShareDetails>> GetShare(
            string subject, string verifiedEmail, bool emailVerified, string shareId)
        {
            return Task.FromResult(
                HttpWrapper<ShareDetails>.FromResult(Results.StatusCodeResult(501)));
        }

        public Task<HttpWrapper<Unit>> RevokeShare(string ownerSubject, string shareId)
        {
            return Task.FromResult(
                HttpWrapper<Unit>.FromResult(Results.StatusCodeResult(501)));
        }
    }
}
