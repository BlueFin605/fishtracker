using System;
using System.Collections.Generic;

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

        public static async Task<HttpWrapper<IEnumerable<R>>> MapEachAsync<T, R>(this Task<HttpWrapper<IEnumerable<T>>> record, Func<T, Task<HttpWrapper<R>>> mapper)
        {
            var waitedRec = await record;

            if (waitedRec.Continue == false)
            {
                var clone = waitedRec.CloneFailed<IEnumerable<R>>();
                return clone;
            }

            IEnumerable<T>? values = waitedRec.Value;
            if (values == null)
                throw new Exception("Mapping null value");

            var d = values.Select(v => mapper(v));
            var all = await Task.WhenAll(d);

            var failed = all.Where(f => f.Continue == false).Select(s => s.Result);
            IEnumerable<R> success = all.Where(f => f.Continue == true && f.Value != null).Select(s => {
                return s.Value ?? throw new Exception("value should npt be null");
            });

            return failed.Any() ? HttpWrapper<IEnumerable<R>>.FromResult(failed.First()) : HttpWrapper<IEnumerable<R>>.Ok(success);
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

