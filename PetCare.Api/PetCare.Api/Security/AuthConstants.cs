using System.Security.Claims;

namespace PetCare.Api.Security;

public static class AuthConstants
{
    public static class ActorTypes
    {
        public const string User = "user";
        public const string Admin = "admin";
    }

    public static class Claims
    {
        public const string ActorType = "actor_type";
        public const string UserId = "user_id";
        public const string AdminId = "admin_id";
        public const string Username = "username";
        public const string AdminRole = "admin_role";
    }

    public static class Cookies
    {
        public const string AdminAccessToken = "pets_admin_access_token";
    }

    public static class Policies
    {
        public const string UserOnly = "UserOnly";
        public const string AdminOnly = "AdminOnly";
        public const string ManagerOnly = "ManagerOnly";
    }

    public static readonly string[] AdminRoles =
    {
        Model.AdminRole.Admin.ToString(),
        Model.AdminRole.Manager.ToString()
    };
}
