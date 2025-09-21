using System.Text.RegularExpressions;

namespace PetCare.Api.Security;

public record PasswordPolicy(
    int MinLength = 8, int MaxLength = 64,
    bool RequireUpper = true, bool RequireLower = true,
    bool RequireDigit = true, bool RequireSpecial = true,
    char[]? DisallowedChars = null, bool DisallowWhitespace = true,
    bool OnlyAsciiPrintable = false
);

public static class PasswordValidator
{
    static readonly Regex U = new(@"[A-Z]"), L = new(@"[a-z]"), D = new(@"\d"), S = new(@"[^A-Za-z0-9]");

    public static (bool Ok, string[] Errors) Validate(string pwd, string username, string? email = null, PasswordPolicy? policy = null)
    {
        policy ??= new();
        var errs = new List<string>();
        if (string.IsNullOrEmpty(pwd)) errs.Add("Password is required.");
        if (pwd.Length < policy.MinLength) errs.Add($"Min length {policy.MinLength}.");
        if (pwd.Length > policy.MaxLength) errs.Add($"Max length {policy.MaxLength}.");
        if (policy.DisallowWhitespace && pwd.Any(char.IsWhiteSpace)) errs.Add("No whitespace.");
        if (policy.OnlyAsciiPrintable && pwd.Any(c => c < 32 || c > 126)) errs.Add("Only ASCII.");

        if (policy.RequireUpper && !U.IsMatch(pwd)) errs.Add("Needs uppercase.");
        //if (policy.RequireLower && !L.IsMatch(pwd)) errs.Add("Needs lowercase.");
        //if (policy.RequireDigit && !D.IsMatch(pwd)) errs.Add("Needs digit.");
        //if (policy.RequireSpecial && !S.IsMatch(pwd)) errs.Add("Needs special.");
        if ((policy.RequireDigit && !D.IsMatch(pwd)) || (policy.RequireSpecial && !S.IsMatch(pwd))) errs.Add("Needs digit or special character.");

        if (policy.DisallowedChars is { Length: > 0 })
        {
            var bad = pwd.FirstOrDefault(c => policy.DisallowedChars.Contains(c));
            if (bad != default) errs.Add($"Forbidden character: '{bad}'.");
        }

        var low = pwd.ToLowerInvariant();
        //if (low.Contains("password")) errs.Add("Too common.");
        //if (low.Contains("1234")) errs.Add("Avoid sequences.");

        if (!string.IsNullOrWhiteSpace(email))
        {
            var local = email.ToLowerInvariant().Split('@')[0];
            if ((local.Length >= 4 && low.Contains(local)) || (low.Contains(username))) errs.Add("Should not contain your email/username.");
        }
        return (errs.Count == 0, errs.ToArray());
    }
}
