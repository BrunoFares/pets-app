using System.Security.Cryptography;
using System.Text;

namespace PetCare.Api.Security;

public static class EmailVerificationTokenService
{
    public static string GenerateToken()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }

    public static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
