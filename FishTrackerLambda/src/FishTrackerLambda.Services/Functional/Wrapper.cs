using System;
namespace FishTrackerLambda.Functional
{
    public struct Wrapper<T>
	{
		bool m_valid = false;

		T? m_value;

		public Wrapper()
		{
			m_valid = false;

			m_value = default(T);
		}

		public Wrapper(T initial)
		{
			m_value = initial;

			m_valid = m_value != null;
		}

        public Wrapper(T initial, bool valid)
        {
            m_value = initial;

            m_valid = valid;
        }

        public static explicit operator Wrapper<T>(T value)
        {
			return new Wrapper<T>(value);
        }

		public bool IsOk => m_valid;
    }
}

