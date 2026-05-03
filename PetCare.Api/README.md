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
- Python FastAPI service for ML-assisted forum moderation

## Setup

From the API project directory:

```bash
cd PetCare.Api/PetCare.Api
dotnet restore
dotnet ef database update
dotnet run
```

The API listens on port `5063`.

Swagger is available in development at:

```text
http://localhost:5063/swagger
```

or:

```text
http://127.0.0.1:5063/swagger
```

## Configuration

Configuration lives in:

```text
PetCare.Api/PetCare.Api/appsettings.json
```

and environment-specific overrides such as:

```text
appsettings.Development.json
```

Important sections:

- `ConnectionStrings:Postgres` - PostgreSQL connection string
- `Jwt` - issuer, audience, signing secret, and token lifetime
- `Email` - SMTP settings for account security email flows
- `PetTranslator` - pet audio translation thresholds and timeout
- `ForumModeration` - Python moderation service URL, thresholds, and fallback behavior

For local development, avoid committing real secrets. Use user secrets, environment variables, or local-only config overrides.

Example forum moderation configuration:

```json
{
  "ForumModeration": {
    "PythonInferenceUrl": "http://127.0.0.1:8010",
    "TimeoutSeconds": 5,
    "UseRulesFallback": false
  }
}
```

## Forum Moderation ML Model

The backend can call a local Python HTTP service for forum text moderation.

By default, the backend expects the Python inference service to run at:

```text
http://127.0.0.1:8010
```

The backend sends moderation requests to the Python service using:

```http
POST /predict
Content-Type: application/json

{ "text": "forum post text" }
```

Expected response shape:

```json
{
  "predictedLabel": "Safe",
  "confidence": 0.98,
  "probabilities": {
    "Safe": 0.98,
    "Spam": 0.01,
    "Abusive": 0.0,
    "Suspicious": 0.01
  }
}
```

### Local Python Setup

From the moderation project directory:

```bash
cd PetCare.Api/PetCare.Api/ml-forum-moderation
```

Create and activate a virtual environment.

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Model File Requirement

The inference API expects a trained baseline model at:

```text
models/baseline/forum_moderation_baseline.joblib
```

Before running the inference API, verify that the file exists.

On macOS/Linux:

```bash
ls models/baseline
```

On Windows PowerShell:

```powershell
dir models\baseline
```

Expected file:

```text
forum_moderation_baseline.joblib
```

If the file does not exist, train the baseline model first.

Use the training command provided in:

```text
PetCare.Api/PetCare.Api/ml-forum-moderation/README.md
```

or run the project’s baseline training script if available.

For example:

```bash
python3 <training-script-name>.py
```

On Windows:

```powershell
python <training-script-name>.py
```

After training, confirm that this file was created:

```text
models/baseline/forum_moderation_baseline.joblib
```

If the trained `.joblib` file exists somewhere else, either move it into:

```text
models/baseline/forum_moderation_baseline.joblib
```

or update the `--model-path` argument when starting the inference API.

### Running the Inference API

Run the Python inference service from inside:

```text
PetCare.Api/PetCare.Api/ml-forum-moderation
```

On macOS/Linux:

```bash
python3 inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

On Windows PowerShell:

```powershell
python inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

Important: the backend is configured to call port `8010`, so the Python service should also run on port `8010`.

Do not run the service on port `8000` unless you also update the backend configuration:

```json
{
  "ForumModeration": {
    "PythonInferenceUrl": "http://127.0.0.1:8000"
  }
}
```

### Testing the Inference API Directly

After starting the Python service, test it before testing through the .NET backend.

On macOS/Linux:

```bash
curl -X POST http://127.0.0.1:8010/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"buy now click here free money"}'
```

On Windows PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8010/predict" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"text":"buy now click here free money"}'
```

Example response:

```json
{
  "predictedLabel": "Spam",
  "confidence": 0.95,
  "probabilities": {
    "Safe": 0.02,
    "Spam": 0.95,
    "Abusive": 0.01,
    "Suspicious": 0.02
  }
}
```

The exact label and confidence may differ depending on the trained model and dataset.

### Common Forum Moderation Errors

#### Error: model not found

Example:

```json
{
  "detail": "Baseline moderation model not found: models/baseline/forum_moderation_baseline.joblib"
}
```

This means the Python service is running, but the trained model file is missing.

Fix:

1. Make sure you are inside:

```text
PetCare.Api/PetCare.Api/ml-forum-moderation
```

2. Check whether the model exists:

```bash
ls models/baseline
```

3. If it does not exist, train the baseline model or copy the `.joblib` file into:

```text
models/baseline/forum_moderation_baseline.joblib
```

4. Restart the Python inference API.

#### Error: backend cannot reach Python service

Make sure the Python service is running on:

```text
http://127.0.0.1:8010
```

and that the backend configuration uses:

```json
{
  "ForumModeration": {
    "PythonInferenceUrl": "http://127.0.0.1:8010"
  }
}
```

#### Error: missing Python package

If Python reports a missing package, install dependencies again:

```bash
pip install -r requirements.txt
```

or install the missing package manually, for example:

```bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib
```

### Rules-Based Fallback

If the Python service is unavailable, the backend can use the configured rules-based fallback when:

```json
{
  "ForumModeration": {
    "UseRulesFallback": true
  }
}
```

Recommended behavior:

- Use `UseRulesFallback: false` when you want to clearly verify that the ML service is working.
- Use `UseRulesFallback: true` for demos if you want the forum moderation feature to keep working even when the Python service is not running.

See:

```text
PetCare.Api/PetCare.Api/ml-forum-moderation/README.md
```

for dataset export, training, evaluation, and inference details.

## Running the Full Local Stack

For local development with forum moderation enabled, run the Python service and the .NET API at the same time.

### Terminal 1 — Python Forum Moderation Service

```bash
cd PetCare.Api/PetCare.Api/ml-forum-moderation
source .venv/bin/activate
python3 inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

On Windows PowerShell:

```powershell
cd PetCare.Api/PetCare.Api/ml-forum-moderation
.\.venv\Scripts\Activate.ps1
python inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

### Terminal 2 — ASP.NET Core API

```bash
cd PetCare.Api/PetCare.Api
dotnet run
```

The backend should now be able to call the local Python moderation service.

## Useful Commands

```bash
dotnet build
dotnet run
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

For Python moderation:

```bash
cd PetCare.Api/PetCare.Api/ml-forum-moderation
source .venv/bin/activate
python3 inference/api.py --model-path models/baseline/forum_moderation_baseline.joblib --host 127.0.0.1 --port 8010
```

## Admin UI

The backend serves and protects the admin workflows used by:

```text
pets-app-admin/
```

In development, local admin UI origins are allowed by the configured CORS policy.

## Project Structure

- `Controllers/` - API endpoints
- `Data/` - EF Core database context
- `DTOs/` - request and response contracts
- `Model/` - domain models and enums
- `Security/` - JWT, authorization, password, and token helpers
- `Services/` - domain services, email, moderation, and translation logic
- `Migrations/` - EF Core migrations
- `ML/` - local Python pet translator assets and scripts
- `ml-forum-moderation/` - local Python forum moderation training and inference service
- `sql/` - database helper scripts
