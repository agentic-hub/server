# Supabase Edge Functions

This directory contains Supabase Edge Functions that replace the Express server previously used for OAuth and API endpoints.

## Structure

- `_shared/` - Shared utilities used by multiple edge functions
  - `cors.ts` - CORS headers for Edge Functions

- `oauth/` - OAuth authentication edge function
  - `index.ts` - Handles OAuth initialization and callback

- `api/` - API endpoints edge function
  - `index.ts` - Handles API endpoints for credentials, scopes, and user integrations

## Deployment

To deploy these edge functions to your Supabase project, use the Supabase CLI:

```bash
supabase functions deploy oauth
supabase functions deploy api
```

## Local Development

To run these edge functions locally, use the Supabase CLI:

```bash
supabase start
supabase functions serve
```

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `SLACK_CLIENT_ID` - Slack OAuth client ID
- `SLACK_CLIENT_SECRET` - Slack OAuth client secret
- `FACEBOOK_CLIENT_ID` - Facebook OAuth client ID
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## API Endpoints

### OAuth Endpoints

- `POST /oauth/init/:provider` - Initialize OAuth flow for a provider
  - Query parameters:
    - `integration_id` - ID of the integration
    - `redirect_client` - URL to redirect to after OAuth flow
    - `scopes` - JSON array of requested scopes
    - `userId` - User ID (optional)
    - `save` - Whether to save the credentials (optional)
    - `name` - Name for the integration (optional)

- `GET /oauth/:provider/callback` - OAuth callback endpoint

### API Endpoints

- `GET /api/credentials/:id` - Get OAuth credentials by ID
  - Query parameters:
    - `userId` - User ID (optional)
    - `save` - Whether to save the credentials (optional)
    - `name` - Name for the integration (optional)

- `GET /api/google/scopes` - Get available Google scopes

- `GET /api/provider/:provider/scopes` - Get available scopes for a provider

- `GET /api/user-integrations` - Get user integrations
  - Query parameters:
    - `userId` - User ID

- `DELETE /api/user-integrations/:id` - Delete a user integration
  - Query parameters:
    - `userId` - User ID

- `GET /api/user-credentials` - Get user credentials for the dashboard
  - Query parameters:
    - `userId` - User ID 