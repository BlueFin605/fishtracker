using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.DataAccess
{
    public interface IShareRepository
    {
        Task<DynamoDbShare?> GetByOwner(string ownerSubject, string shareId);
        Task<List<DynamoDbShare>> ListByOwner(string ownerSubject);
        Task<DynamoDbShare?> GetByShareId(string shareId);
        Task<List<DynamoDbShare>> ListByRecipientEmail(string lowerCaseEmail);
        Task<DynamoDbShare> Save(DynamoDbShare share);
        Task<DynamoDbShare> Update(DynamoDbShare share);
    }
}
