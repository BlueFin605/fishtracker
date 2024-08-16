using FishTrackerLambda.Services.Http;

namespace FishTrackerLambda.Functional
{
    public class HttpWrapper<T>
    {
        bool m_canContinue = false;

        IResult? m_httpCode = Results.NotFound();

        T? m_value;

        public HttpWrapper(T? initial)
        {
            m_value = initial;

            m_canContinue = true;

            m_httpCode = null;
        }

        private HttpWrapper(IResult result)
        {
            m_httpCode = result;
            m_canContinue = false;
            m_value = default(T);
        }

        public HttpWrapper<R> CloneFailed<R>()
        {
            return new HttpWrapper<R>(Result);
        }

        public static HttpWrapper<T> NotFound => new HttpWrapper<T>(Results.NotFound());

        public static HttpWrapper<T> Ok(T? value) => new HttpWrapper<T>(value);

        public static HttpWrapper<T> FromResult(IResult result) => new HttpWrapper<T>(result);

        public bool Continue => m_canContinue;

        public IResult Result => m_httpCode ?? Results.Ok(m_value);

        public T? Value => m_value;
    }
}

