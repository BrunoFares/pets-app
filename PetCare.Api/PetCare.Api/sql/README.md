This folder contains PostgreSQL helper scripts for local setup and demo data.
Run these from the `PetCare.Api/PetCare.Api` directory. The schema can be
applied either through EF Core or through the checked-in idempotent SQL upgrade
script, so use the scripts in this order:

1. Create the PostgreSQL login/database:

   ```powershell
   psql -h 127.0.0.1 -U postgres -d postgres -f sql/create_petapp_database.sql
   ```

2. Apply the schema updates. Use either EF Core or the SQL script:

   ```powershell
   dotnet ef database update
   ```

   ```powershell
   psql -h 127.0.0.1 -U petapp -d petapp -f sql/update_petapp_schema.sql
   ```

3. Load the dummy dataset:

   ```powershell
   psql -h 127.0.0.1 -U petapp -d petapp -f sql/seed_petapp_dummy_data.sql
   ```

Notes:

- `create_petapp_database.sql` creates the `petapp` PostgreSQL role and the
  `petapp` database.
- `update_petapp_schema.sql` is an idempotent PostgreSQL migration script
  generated from the current EF Core migrations. It is safe to rerun and is
  useful when you need to bring an already-created database up to the latest
  schema without relying on `dotnet ef`. It also reapplies runtime grants to
  the `petapp` role when you run it as the object owner or a superuser.
- `seed_petapp_dummy_data.sql` is intentionally destructive for app data. It
  truncates the current PetCare tables, then reloads a full sample dataset.
- Update your local connection string password to match the database role
  password defined in `create_petapp_database.sql`.
- `grant_petapp_permissions.sql` is still useful when you already have a
  PostgreSQL database and only need to grant runtime access to the `petapp`
  role. If you already created tables with `postgres` and the app connects as
  `petapp`, run it once as a superuser or the table owner to fix `permission
  denied` errors on newly added tables.
