namespace Douji.Backend.Config.EnvironmentVariables;

public class EnVarNotDefinedException(string variable) : Exception($"Mandatory environment variable {variable} isn't defined.");