Manual bootstrap/seed SQL scripts were removed from this folder because they had
drifted from the current EF Core model and migrations.

Use EF Core migrations as the source of truth for schema setup:

```powershell
dotnet ef database update
```

`grant_petapp_permissions.sql` remains because it is still useful when granting
runtime permissions on an existing PostgreSQL database.
