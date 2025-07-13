namespace Douji.Backend.Config.EnvironmentVariables;

public static class EnVarHelper
{
	public static IEnumerable<string> GetUrls(string variableName, IEnumerable<string>? defaultValue = null)
	{
		var a = Environment.GetEnvironmentVariables();
		string? value = Environment.GetEnvironmentVariable(variableName);

		if (value == null)
		{
			return defaultValue ?? throw new EnVarNotDefinedException(variableName);
		}

		return value.Split(' ', '\t').Where(text => !(string.IsNullOrEmpty(text) || string.IsNullOrWhiteSpace(text)));
	}

	public static bool? GetBool(string variableName, bool throwIfNull = false)
	{
		string? value = Environment.GetEnvironmentVariable(variableName);

		if (value == null)
		{
			if (throwIfNull)
			{
				throw new EnVarNotDefinedException(variableName);
			}
			else
			{
				return null;
			}
		}

		return value.ToLower() switch
		{
			"0" or "false" => false,
			"1" or "true" => true,
			_ => throw new FormatException($"Environment variable {variableName} has invalid format. Expected bool, actual value is '{value}'."),
		};
	}
}