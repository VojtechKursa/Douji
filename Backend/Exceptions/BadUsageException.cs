namespace Douji.Backend.Exceptions;

public class BadUsageException : Exception
{
	public BadUsageException()
		: base("Bad usage.")
	{ }

	public BadUsageException(string method)
		: base($"Bad usage of method {method}")
	{ }
}
