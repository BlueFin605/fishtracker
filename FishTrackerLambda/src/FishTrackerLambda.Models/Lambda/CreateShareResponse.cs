namespace FishTrackerLambda.Models.Lambda;

public record CreateShareResponse(
    string ShareId,
    bool EmailSent,
    bool ThumbnailGenerated);
