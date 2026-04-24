using System.IO;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class S3ThumbnailStorage : IThumbnailStorage
    {
        private readonly IAmazonS3 _s3;
        private readonly string _bucket;
        private readonly string _region;
        private readonly ILogger<S3ThumbnailStorage> _log;

        public S3ThumbnailStorage(IAmazonS3 s3, string bucket, string region, ILogger<S3ThumbnailStorage> log)
        {
            _s3 = s3;
            _bucket = bucket;
            _region = region;
            _log = log;
        }

        public async Task<string> PutAsync(string shareId, byte[] png, CancellationToken ct)
        {
            var key = $"{shareId}.png";
            using var stream = new MemoryStream(png);
            await _s3.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _bucket,
                Key = key,
                InputStream = stream,
                ContentType = "image/png"
            }, ct);
            _log.LogInformation("Uploaded thumbnail {Key} ({Bytes} bytes)", key, png.Length);
            return key;
        }

        public Task DeleteAsync(string key, CancellationToken ct) =>
            _s3.DeleteObjectAsync(new DeleteObjectRequest { BucketName = _bucket, Key = key }, ct);

        public string PublicUrl(string key) =>
            $"https://{_bucket}.s3.{_region}.amazonaws.com/{key}";
    }
}
