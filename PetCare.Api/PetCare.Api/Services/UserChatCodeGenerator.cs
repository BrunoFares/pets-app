using System.Security.Cryptography;

namespace PetCare.Api.Services;

public static class UserChatCodeGenerator
{
    public const int CodeLength = 8;

    private const string Alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    public static string Generate()
    {
        Span<char> code = stackalloc char[CodeLength];

        for (var i = 0; i < code.Length; i++)
        {
            code[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return new string(code);
    }

    public static string? Normalize(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return null;
        }

        Span<char> normalized = stackalloc char[CodeLength];
        var length = 0;

        foreach (var character in code.Trim())
        {
            if (character is '-' || char.IsWhiteSpace(character))
            {
                continue;
            }

            if (length >= CodeLength)
            {
                return null;
            }

            var upper = char.ToUpperInvariant(character);
            if (!Alphabet.Contains(upper, StringComparison.Ordinal))
            {
                return null;
            }

            normalized[length] = upper;
            length++;
        }

        return length == CodeLength ? new string(normalized) : null;
    }
}
