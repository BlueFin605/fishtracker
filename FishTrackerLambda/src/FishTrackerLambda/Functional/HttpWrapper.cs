namespace FishTrackerLambda.Functional
{
    public class HttpWrapper<T>
    {
        bool m_canContinue = false;

        IResult? m_httpCode = Results.NotFound();

        T? m_value;

        public HttpWrapper()
        {
            m_canContinue = false;

            m_httpCode = Results.NotFound();

            m_value = default(T);
        }

        public HttpWrapper(T? initial)
        {
            m_value = initial;

            m_canContinue = true;

            m_httpCode = null;
        }

        private HttpWrapper(T initial, bool valid)
        {
            m_value = initial;

            m_canContinue = valid;

            m_httpCode = m_canContinue ? null : Results.NotFound();
        }

        private HttpWrapper(IResult result)
        {
            m_httpCode = result;
            m_canContinue = false;
            m_value = default(T);
        }

        public static explicit operator HttpWrapper<T>(T value)
        {
            return new HttpWrapper<T>(value);
        }

        public HttpWrapper<R> CloneFailed<R>()
        {
            return new HttpWrapper<R>(Result);
        }

        public static HttpWrapper<T> NotFound => new HttpWrapper<T>();

        public static HttpWrapper<T> Ok(T? value) => new HttpWrapper<T>(value);

        public static HttpWrapper<T> FromResult(IResult result) => new HttpWrapper<T>(result);

        public bool Continue => m_canContinue;

        public IResult Result => m_httpCode ?? Results.Ok(m_value);

        public T? Value => m_value;
    }
}

