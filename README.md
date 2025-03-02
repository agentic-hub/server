# AI Agent MPC Hub

A platform for connecting AI agents with multiple services and automating workflows through a powerful Multi-Party Computation (MPC) hub. This application allows users to securely connect to various third-party services via OAuth2 and manage their credentials in one place.

## Features

- User authentication with Supabase
- OAuth2 integration for connecting to third-party services
- Secure credential management
- Multiple service integrations:
  - Google
  - Slack
  - GitHub
  - More coming soon

## Prerequisites

- Node.js 16+ and npm/yarn
- [Supabase](https://supabase.com) account (or use the local Docker setup)
- OAuth credentials for services you want to integrate (Google, Slack, GitHub, etc.)
- Docker and Docker Compose (for local Supabase development)

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:agentic-hub/server.git
cd server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Option A: Using Supabase Cloud

1. Create a new project on [Supabase](https://app.supabase.com)
2. Go to Project Settings > API to get your project URL and anon key
3. Run the SQL migrations to set up your database schema:
   ```bash
   # Install Supabase CLI if you haven't already
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF
   ```

#### Option B: Using Local Docker Setup

1. Set up the local Supabase environment:
   ```bash
   # Create necessary directories and prepare environment
   make supabase-setup
   
   # Start Supabase services
   make supabase-start
   ```

2. Access Supabase Studio at http://localhost:3000
3. The API endpoint will be available at http://localhost:8000

### 4. Configure Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific configuration values:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server Configuration
PORT=3001
SESSION_SECRET=your-session-secret

# OAuth Providers
# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Slack
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_CALLBACK_URL=http://localhost:3001/auth/slack/callback
```

> Note: The `.env` file is included in `.gitignore` to prevent sensitive credentials from being committed to your repository.

### 5. Start the Development Server

You need to run both the frontend and OAuth server:

```bash
# In one terminal, start the frontend
npm run dev

# In another terminal, start the OAuth server
npm run server
```

The application will be available at:
- Frontend: http://localhost:5173
- OAuth Server: http://localhost:3001

## Setting Up OAuth Providers

### Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to APIs & Services > Credentials
4. Create an OAuth 2.0 Client ID
5. Add the following redirect URI: `http://localhost:3001/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Add the callback URL: `http://localhost:3001/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

### Slack OAuth

1. Go to the [Slack API](https://api.slack.com/apps) page
2. Create a new app
3. Add the redirect URL: `http://localhost:3001/auth/slack/callback`
4. Add necessary scopes (e.g., `users:read`, `chat:write`)
5. Copy the Client ID and Client Secret to your `.env` file

## Database Schema

The application uses Supabase with the following tables:

- `profiles`: User profiles linked to Supabase Auth
- `integrations`: Available service integrations
- `integration_categories`: Categories for organizing integrations
- `credentials`: User credentials for connected services

## Adding a New OAuth Provider

1. Configure the provider in `server/index.js`
2. Add the provider credentials to your `.env` file
3. Update the `getOAuthProvider` function in `OAuthConnectButton.tsx`

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