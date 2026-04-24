using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface IShareService
    {
        Task<HttpWrapper<CreateShareResponse>> NewShare(string ownerSubject, string ownerDisplayName, NewShare req);
        Task<HttpWrapper<IEnumerable<ShareSummary>>> GetShares(string subject, string verifiedEmail, string direction);
        Task<HttpWrapper<ShareDetails>> GetShare(string subject, string verifiedEmail, bool emailVerified, string shareId);
        Task<HttpWrapper<Unit>> RevokeShare(string ownerSubject, string shareId);
    }

    public readonly struct Unit { public static readonly Unit Value = default; }
}
