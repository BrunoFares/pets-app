using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PetCare.Api.Model;

namespace PetCare.Api.Security;

public static class JwtIssuer
{
    public static string CreateUserToken(string userId, string username, string email, string secret, string issuer, string audience, int minutes)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(AuthConstants.Claims.ActorType, AuthConstants.ActorTypes.User),
            new Claim(AuthConstants.Claims.UserId, userId),
            new Claim(AuthConstants.Claims.Username, username),
            new Claim(JwtRegisteredClaimNames.Email, email)
        };

        return CreateToken(claims, secret, issuer, audience, minutes);
    }

    public static string CreateAdminToken(string adminId, string username, string email, AdminRole role, string secret, string issuer, string audience, int minutes)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, adminId),
            new Claim(ClaimTypes.NameIdentifier, adminId),
            new Claim(AuthConstants.Claims.ActorType, AuthConstants.ActorTypes.Admin),
            new Claim(AuthConstants.Claims.AdminId, adminId),
            new Claim(AuthConstants.Claims.Username, username),
            new Claim(AuthConstants.Claims.AdminRole, role.ToString()),
            new Claim(ClaimTypes.Role, role.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email)
        };

        return CreateToken(claims, secret, issuer, audience, minutes);
    }

    private static string CreateToken(IEnumerable<Claim> claims, string secret, string issuer, string audience, int minutes)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
