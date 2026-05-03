# PetCare API

ASP.NET Core backend for the Pets App mobile client and admin UI.

## What It Provides

- JWT authentication for app users and admins
- Account security flows for email verification, password reset, and email change
- Pet profile, vaccine, illness, medication, and consultation APIs
- Places, place reviews, and place owner application workflows
- Forum posts, replies, likes, bookmarks, reports, moderation, and user blocking
- Direct messages with media attachments
- Pet translator and forum moderation service integration
- Static upload hosting for user, place, forum, and message media
- Swagger/OpenAPI in development

## Tech Stack

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL via Npgsql
- JWT bearer authentication
- Swagger / Swashbuckle

## Setup

From the API project directory:

```bash
cd PetCare.Api/PetCare.Api
dotnet restore
dotnet ef database update
dotnet run
```

The API listens on port `5063`.

## Configuration

Configuration lives in `PetCare.Api/PetCare.Api/appsettings.json` and environment-specific overrides.

Important sections:

- `ConnectionStrings:Postgres` - PostgreSQL connection string
- `Jwt` - issuer, audience, signing secret, and token lifetime
- `Email` - SMTP settings for account security email flows
- `PetTranslator` - pet audio translation thresholds and timeout
- `ForumModeration` - Python moderation service URL and thresholds

For local development, avoid committing real secrets. Use user secrets, environment variables, or local-only config overrides.

## Useful Commands

```bash
dotnet build
dotnet run
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

## Admin UI

The backend serves and protects the admin workflows used by `pets-app-admin/`. In development, local admin UI origins are allowed by the configured CORS policy.

## Project Structure

- `Controllers/` - API endpoints
- `Data/` - EF Core database context
- `DTOs/` - request and response contracts
- `Model/` - domain models and enums
- `Security/` - JWT, authorization, password, and token helpers
- `Services/` - domain services, email, moderation, and translation logic
- `Migrations/` - EF Core migrations
- `ML/` - local Python pet translator assets and scripts
- `sql/` - database helper scripts
