# Supabase Edge Functions for OAuth

This directory contains Supabase Edge Functions for handling OAuth authentication flows with various providers.

## Structure

- `oauth/index.ts` - Main OAuth Edge Function that handles:
  - OAuth initialization
  - OAuth callbacks
  - Credential retrieval
  - Google scopes information

- `_shared/cors.ts` - Shared CORS headers for use across Edge Functions

## Database Tables

The OAuth flow uses two database tables:

1. `oauth_states` - Stores OAuth state parameters to prevent CSRF attacks
2. `oauth_credentials` - Stores temporary OAuth credentials before they are saved to the user's account

## Environment Variables

The following environment variables need to be set in your Supabase project:

```bash
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

## Deployment

To deploy the Edge Functions to your Supabase project:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy oauth
```

## Local Development

To run the Edge Functions locally:

```bash
# Start the local development server
supabase start

# Run the functions locally
supabase functions serve oauth --env-file .env.local
```

## API Endpoints

### OAuth Initialization

```
GET /oauth/init/:provider
```

Query parameters:
- `integration_id` - The ID of the integration
- `redirect_client` - The URL to redirect to after authentication
- `scopes` - JSON array of requested scopes

### OAuth Callback

```
GET /oauth/:provider/callback
```

Query parameters:
- `code` - The authorization code from the OAuth provider
- `state` - The state parameter to prevent CSRF attacks

### Retrieve Credentials

```
GET /oauth/credentials?id=:credential_id
```

### Get Google Scopes

```
GET /oauth/google/scopes
```

## Client Usage

Example of initializing OAuth flow from the client:

```javascript
// Redirect to OAuth initialization
const provider = 'google';
const integrationId = '123';
const requestedScopes = ['gmail', 'calendar'];
const redirectClient = 'http://localhost:5173/integrations';

const scopesParam = encodeURIComponent(JSON.stringify(requestedScopes));
window.location.href = `${SUPABASE_FUNCTIONS_URL}/oauth/init/${provider}?integration_id=${integrationId}&redirect_client=${redirectClient}&scopes=${scopesParam}`;
```

Example of retrieving credentials after OAuth callback:

```javascript
// Get credential ID from URL
const urlParams = new URLSearchParams(window.location.search);
const credentialId = urlParams.get('credential_id');

if (credentialId) {
  // Fetch credentials
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/oauth/credentials?id=${credentialId}`);
  const credentials = await response.json();
  
  // Save credentials to database
  // ...
}
``` 