# Agentic Hub

A secure platform for managing API integrations with encrypted credential storage.

## Features

- OAuth integration with multiple providers (Google, GitHub, Slack, etc.)
- Secure credential storage with encryption
- Multi-party computation (MPC) security for API keys
- User-friendly interface for managing integrations

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

Start both the frontend and OAuth server:

```
npm run start
```

Or run them separately:

- Frontend: `npm run dev`
- OAuth Server: `npm run server`

## Database Setup

The application uses Supabase for database storage. The schema includes:

- `profiles`: User profiles
- `integrations`: Available API integrations
- `credentials`: Encrypted user credentials for integrations
- `api_connections`: Active connections between users and APIs
- `api_logs`: Logs of API requests and responses

## OAuth Flow

1. User initiates OAuth flow from the UI
2. Server redirects to the provider's authorization page
3. Provider redirects back to our callback URL
4. Server stores credentials temporarily with a unique ID
5. Client retrieves credentials and saves them to the database with encryption

## Development

### Adding a New Integration

1. Add the provider configuration in `server/index.js`
2. Add OAuth credentials to `.env`
3. Add the integration to the database

### Modifying Encryption

The encryption implementation uses `crypto-js` with AES encryption. To modify:

1. Update the encryption/decryption functions in `server/index.js`
2. Ensure the `ENCRYPTION_KEY` environment variable is set

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

### Connecting to the Local Database

You can connect to the local PostgreSQL database using:

- Host: localhost
- Port: 5432
- Database: postgres
- Username: postgres
- Password: postgres (or as configured in .env.supabase)