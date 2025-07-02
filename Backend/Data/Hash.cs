using System.Security.Cryptography;
using System.Text;

namespace Douji.Backend.Data;

public static class Hash
{
	public const int HashLengthHex = 64;
	public static readonly HashAlgorithm StandardHash = SHA3_256.Create();

	public static readonly Encoding StandardEncoding = Encoding.UTF8;

	public static byte[] Digest(string text) =>
		Digest(StandardEncoding.GetBytes(text));

	public static byte[] Digest(byte[] data) =>
		StandardHash.ComputeHash(data);

	public static async Task<byte[]> DigestAsync(string text) =>
		await DigestAsync(StandardEncoding.GetBytes(text));

	public static async Task<byte[]> DigestAsync(byte[] data) =>
		await DigestAsync(new MemoryStream(data));

	public static async Task<byte[]> DigestAsync(Stream data) =>
		await StandardHash.ComputeHashAsync(data);

	public static string ToHex(byte[] data)
	{
		StringBuilder builder = new();

		var encodedBytes = data.Select(x => x.ToString("X2"));

		foreach (var encodedByte in encodedBytes)
		{
			builder.Append(encodedByte);
		}

		return builder.ToString();
	}
}
