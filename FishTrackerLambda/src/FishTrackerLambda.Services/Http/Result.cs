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
    }
}

