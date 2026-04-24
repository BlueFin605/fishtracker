namespace FishTrackerLambda.Services.Http
{
    public class Results : IResult
    {
        public int StatusCode { get; private set; }
        public string Message { get; private set; }
        public object? Object { get; private set; }

        private Results(int statusCode, string message)
        {
            StatusCode = statusCode;
            Message = message;
            Object = null;
        }

        private Results(int statusCode, object? obj)
        {
            StatusCode = statusCode;
            Message = string.Empty;
            Object = obj;
        }

        public static IResult NotFound(string message = "Not Found")
        {
            return new Results(404, message);
        }

        public static IResult BadRequest(string message = "Bad Request")
        {
            return new Results(400, message);
        }

        public static IResult Ok(object? obj = null)
        {
            return new Results(200, obj);
        }

        public static IResult InternalServerError(string message = "Internal Server Error")
        {
            return new Results(500, message);
        }

        public static IResult Forbidden(string message = "Forbidden")
        {
            return new Results(403, message);
        }

        public static IResult Gone(string message = "Gone")
        {
            return new Results(410, message);
        }

        public static IResult PayloadTooLarge(string message = "Payload Too Large")
        {
            return new Results(413, message);
        }

        public static IResult TooManyRequests(string message = "Too Many Requests")
        {
            return new Results(429, message);
        }

        public static IResult StatusCodeResult(int statusCode, string message = "")
        {
            return new Results(statusCode, message);
        }
    }
}
