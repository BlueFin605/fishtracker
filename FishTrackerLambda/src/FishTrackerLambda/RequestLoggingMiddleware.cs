using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Log request details
        var requestDetails = new
        {
            Method = context.Request.Method,
            Path = context.Request.Path,
            Headers = context.Request.Headers,
            Body = await ReadRequestBodyAsync(context.Request)
        };

        var requestJson = JsonSerializer.Serialize(requestDetails, new JsonSerializerOptions { WriteIndented = true });
        _logger.LogInformation("Request: {Request}", requestJson);

        await _next(context);
    }

    private async Task<string> ReadRequestBodyAsync(HttpRequest request)
    {
        request.EnableBuffering();
        var body = await new StreamReader(request.Body).ReadToEndAsync();
        request.Body.Position = 0;
        return body;
    }
}