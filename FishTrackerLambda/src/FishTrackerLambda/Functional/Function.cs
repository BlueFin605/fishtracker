using System;
namespace FishTrackerLambda.Functional
{
	public static class Function
	{
        public static Task<HttpWrapper<object>> ValidateInput(Func<IResult?> result)
        {
            var res = result();
            return Task.FromResult(res == null ? HttpWrapper<object>.Ok(new object()) : HttpWrapper<object>.FromResult(res));
        }

        public static Task<HttpWrapper<object>> ValidateInput(this Task<HttpWrapper<object>> record, Func<IResult?> result)
        {
            return ValidateInput(result);
        }

        public static Task<HttpWrapper<T>> Init<T>(T value)
        {
            return Task.FromResult(new HttpWrapper<T>(value));
        }

        public static Task<HttpWrapper<T>> InitAsync<T>(Task<HttpWrapper<T>> record)
        {
            return record;
        }

        public static Task<HttpWrapper<R>> Init<T,R>(this Task<HttpWrapper<T>> record, R value)
        {
            return Task.FromResult(new HttpWrapper<R>(value));
        }

        public static async Task<HttpWrapper<R>> MapAsync<T,R>(this Task<HttpWrapper<T>> record, Func<T, Task<HttpWrapper<R>>> mapper)
		{
			var waitedRec = await record;

			if (waitedRec.Continue == false)
			{
				var clone = waitedRec.CloneFailed<R>();
                return clone;
			}

            T? value = waitedRec.Value;

            return value != null ? await mapper(value) : throw new Exception("Mapping null value");
		}

        public static async Task<HttpWrapper<R>> Map<T, R>(this Task<HttpWrapper<T>> record, Func<T, R> mapper)
        {
            var waitedRec = await record;

            if (waitedRec.Continue == false)
            {
                var clone = waitedRec.CloneFailed<R>();
                return clone;
            }

            T? value = waitedRec.Value;

            return value != null ? new HttpWrapper<R>(mapper(value)) : throw new Exception("Mapping null value");
        }
    }
}

