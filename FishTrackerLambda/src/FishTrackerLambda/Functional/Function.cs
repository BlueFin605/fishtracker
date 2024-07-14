using System;
namespace FishTrackerLambda.Functional
{
	public static class Function
	{
		public static async Task<HttpWrapper<R>> Map<T,R>(this Task<HttpWrapper<T>> record, Func<T, Task<HttpWrapper<R>>> mapper)
		{
			var waitedRec = await record;

			if (waitedRec.Continue == false)
			{
				var clone = waitedRec.CloneFailed<R>();
                return clone;
			}

            T? value = waitedRec.Value;

			if (value == null)
				return new HttpWrapper<R>();

            return await mapper(value);
		}

        public static async Task<HttpWrapper<R>> MapSuccess<T, R>(this Task<HttpWrapper<T>> record, Func<T, R> mapper)
        {
            var waitedRec = await record;

            if (waitedRec.Continue == false)
            {
                var clone = waitedRec.CloneFailed<R>();
                return clone;
            }

            T? value = waitedRec.Value;

            if (value == null)
                return new HttpWrapper<R>();

            return new HttpWrapper<R>(mapper(value));
        }
    }
}

