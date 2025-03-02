# Agentic Hub

A secure platform for managing API integrations with encrypted credential storage.

## Features

- OAuth integration with multiple providers (Google, GitHub, Slack, etc.)
- Secure credential storage with encryption
- Multi-party computation (MPC) security for API keys
- User-friendly interface for managing integrations
- Serverless architecture using Supabase Edge Functions

## Security Features

- **Encrypted Credentials**: All sensitive data like access tokens and refresh tokens are encrypted before being stored in the database
- **Environment Variable Security**: Encryption keys and service keys are stored in environment variables
- **Row-Level Security**: Database tables use Supabase RLS policies to ensure users can only access their own data

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values:
     - Supabase URL and keys
     - OAuth provider credentials
     - Encryption key (generate a secure random string)

## Running the Application

Start the frontend application:

```
npm run start
```

For the backend, we use Supabase Edge Functions. To run them locally:

```
cd supabase
supabase start
supabase functions serve
```

## Database Setup

The application uses Supabase for database storage. The schema includes:

- `profiles`: User profiles
- `integrations`: Available API integrations
- `user_integrations`: User connections to integrations with encrypted credentials
- `oauth_states`: Temporary storage for OAuth state parameters
- `oauth_credentials`: Temporary storage for OAuth credentials

## OAuth Flow

1. User initiates OAuth flow from the UI
2. Edge Function redirects to the provider's authorization page
3. Provider redirects back to our callback URL
4. Edge Function stores credentials temporarily with a unique ID
5. Client retrieves credentials and saves them to the database with encryption

## Edge Functions

The application uses Supabase Edge Functions for all backend functionality:

- `oauth`: Handles OAuth initialization and callback
- `api`: Handles API endpoints for credentials, scopes, and user integrations

See the [Edge Functions README](supabase/functions/README.md) for more details.

## Development

### Adding a New Integration

1. Add the provider configuration in `supabase/functions/oauth/index.ts`
2. Add OAuth credentials to Supabase environment variables
3. Add the integration to the database

### Modifying Encryption

The encryption implementation uses database functions with pgcrypto. To modify:

1. Update the encryption/decryption functions in the database migrations
2. Ensure the encryption keys are properly set in Supabase environment variables

## License

MIT

## Development

## Local Supabase Development

For local development, you can use the Docker-based Supabase setup. The following Makefile commands are available to manage your local Supabase instance:

### Supabase Docker Commands

| Command | Description |
|---------|-------------|
| `make supabase-setup` | Create necessary directories for Supabase Docker |
| `make supabase-start` | Start all Supabase Docker services |
| `make supabase-stop` | Stop all Supabase Docker services |
| `make supabase-restart` | Restart all Supabase Docker services |
| `make supabase-logs` | View logs for all Supabase services |
| `make supabase-logs service=db` | View logs for a specific service (e.g., db, studio, auth) |
| `make supabase-clean` | Remove all Supabase Docker data and volumes |
| `make supabase-status` | Check status of Supabase Docker services |

### Available Services

The local Supabase setup includes the following services:

- **Supabase Studio**: Web UI for managing your database (http://localhost:3000)
- **API Gateway**: Kong API Gateway (http://localhost:8000)
- **PostgreSQL**: Database (localhost:5432)
- **Auth**: Authentication service
- **REST**: RESTful API
- **Realtime**: Real-time subscriptions
- **Storage**: File storage service
- **Meta**: PostgreSQL metadata service
- **Edge Functions**: Serverless functions (http://localhost:54321/functions/v1)

### Connecting to the Local Database

You can connect to the local PostgreSQL database using:

- Host: localhost
- Port: 5432
- Database: postgres
- Username: postgres
- Password: postgres (or as configured in .env.supabase)

## Environment Variables

The application requires several environment variables to be set. Copy the `.env.example` file to `.env` and update the values as needed.

```bash
cp .env.example .env
```

Key environment variables include:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_FUNCTIONS_URL`: URL for Supabase Edge Functions (default: http://localhost:54321/functions/v1)

For local development with Supabase, the default values in the `.env` file should work out of the box.