using System;
namespace FishTrackerLambda.Services.Http
{
    public interface IResult
    {
        int StatusCode { get; }
        string Message { get; }
        object? Object { get; }
    }
}

