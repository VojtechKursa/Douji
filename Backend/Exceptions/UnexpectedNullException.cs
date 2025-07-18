namespace Douji.Backend.Exceptions;

public class UnexpectedNullException : Exception
{
	public UnexpectedNullException()
		: base("Unexpected null value encountered.")
	{ }

	public UnexpectedNullException(string variable, string? obj = null)
		: base($"Unexpected null value encountered in variable {variable}{(obj != null ? $" in object {obj}" : "")}.")
	{ }
}
