import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Encryption key - should be stored securely in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

// In-memory storage for OAuth states and credentials
// In a production app, you would use a database
const oauthStates = new Map();
const tempCredentials = new Map();

// Define OAuth scopes for different providers
const OAUTH_SCOPES = {
  google: {
    default: ['profile', 'email'],
    gmail: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    sheets: ['https://www.googleapis.com/auth/spreadsheets'],
    drive: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    calendar: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly'],
    youtube: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload']
  },
  github: {
    default: ['user:email', 'read:user'],
    repos: ['repo', 'public_repo'],
    admin: ['admin:org', 'admin:repo_hook'],
    notifications: ['notifications', 'read:discussion']
  },
  slack: {
    default: ['identity.basic'],
    messages: ['chat:write', 'chat:write.public'],
    channels: ['channels:read', 'channels:history', 'groups:read'],
    users: ['users:read', 'users:read.email'],
    files: ['files:read', 'files:write']
  },
  facebook: {
    default: ['email', 'public_profile'],
    pages: ['pages_show_list', 'pages_read_engagement'],
    publishing: ['pages_manage_posts', 'pages_manage_engagement'],
    instagram: ['instagram_basic', 'instagram_content_publish']
  }
};

// Helper functions for OAuth scopes
function getGoogleScopes(requestedScopes = []) {
  // Start with default scopes
  const scopes = [...OAUTH_SCOPES.google.default];
  
  // Add requested service scopes
  if (requestedScopes && requestedScopes.length > 0) {
    requestedScopes.forEach(service => {
      if (OAUTH_SCOPES.google[service]) {
        scopes.push(...OAUTH_SCOPES.google[service]);
      }
    });
  }
  
  // Add custom scopes if provided
  if (requestedScopes && requestedScopes.some(scope => scope.startsWith('https://www.googleapis.com'))) {
    requestedScopes.forEach(scope => {
      if (scope.startsWith('https://www.googleapis.com') && !scopes.includes(scope)) {
        scopes.push(scope);
      }
    });
  }
  
  return scopes;
}

function getProviderScopes(provider, requestedScopes = []) {
  if (provider === 'google') {
    return getGoogleScopes(requestedScopes);
  }
  
  // For other providers with scope categories
  if (OAUTH_SCOPES[provider]) {
    const scopes = [...OAUTH_SCOPES[provider].default];
    
    // Add requested category scopes
    if (requestedScopes && requestedScopes.length > 0) {
      requestedScopes.forEach(category => {
        if (OAUTH_SCOPES[provider][category]) {
          scopes.push(...OAUTH_SCOPES[provider][category]);
        } else if (!scopes.includes(category)) {
          // If it's not a category but a direct scope, add it
          scopes.push(category);
        }
      });
    }
    
    return [...new Set(scopes)]; // Remove duplicates
  }
  
  // For providers without defined scopes, use the requested scopes directly
  return requestedScopes;
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-agent-mpc-hub-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: 'http://localhost:3001/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Store tokens and profile info
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value,
    accessToken,
    refreshToken
  };
  return done(null, user);
}));

// Generic OAuth2 strategy for other providers
function configureOAuth2Strategy(provider, options) {
  passport.use(`${provider}`, new OAuth2Strategy({
    authorizationURL: options.authorizationURL,
    tokenURL: options.tokenURL,
    clientID: options.clientID,
    clientSecret: options.clientSecret,
    callbackURL: `http://localhost:3001/auth/${provider}/callback`,
    state: true
  }, (accessToken, refreshToken, params, profile, done) => {
    // Get user profile if API endpoint is provided
    if (options.profileURL) {
      fetch(options.profileURL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => res.json())
      .then(profileData => {
        const user = {
          id: profileData.id || uuidv4(),
          displayName: profileData.name || profileData.display_name || 'User',
          email: profileData.email || '',
          accessToken,
          refreshToken,
          params // Additional params like scope, token_type, etc.
        };
        return done(null, user);
      })
      .catch(err => {
        // If profile fetch fails, still return the tokens
        const user = {
          id: uuidv4(),
          accessToken,
          refreshToken,
          params
        };
        return done(null, user);
      });
    } else {
      // If no profile URL, just return the tokens
      const user = {
        id: uuidv4(),
        accessToken,
        refreshToken,
        params
      };
      return done(null, user);
    }
  }));
}

// Initialize OAuth routes
app.get('/auth/init/:provider', (req, res) => {
  const { provider } = req.params;
  const { integration_id, redirect_client, scopes } = req.query;
  
  // Parse requested scopes if provided
  const requestedScopes = scopes ? JSON.parse(decodeURIComponent(scopes)) : [];
  
  // Generate a state parameter to prevent CSRF
  const state = uuidv4();
  
  // Store state with metadata
  oauthStates.set(state, {
    provider,
    integration_id,
    redirect_client,
    requestedScopes,
    timestamp: Date.now()
  });
  
  // Configure dynamic OAuth strategy if needed
  if (provider !== 'google') {
    // This would typically come from your database based on integration_id
    const providerConfig = getProviderConfig(provider);
    if (providerConfig) {
      configureOAuth2Strategy(provider, providerConfig);
    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }
  }
  
  // Redirect to OAuth provider
  res.redirect(`/auth/${provider}?state=${state}`);
});

// OAuth routes
app.get('/auth/google', (req, res, next) => {
  const { state } = req.query;
  const stateData = oauthStates.get(state);
  const requestedScopes = stateData?.requestedScopes || [];
  
  passport.authenticate('google', { 
    scope: getGoogleScopes(requestedScopes),
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

app.get('/auth/:provider', (req, res, next) => {
  const { provider } = req.params;
  const { state } = req.query;
  
  if (provider !== 'google' && oauthStates.has(state)) {
    const stateData = oauthStates.get(state);
    const requestedScopes = stateData?.requestedScopes || [];
    
    passport.authenticate(provider, {
      scope: getProviderScopes(provider, requestedScopes),
      state,
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  } else {
    next();
  }
});

// OAuth callback routes
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/error' }), handleOAuthCallback);

app.get('/auth/:provider/callback', (req, res, next) => {
  const { provider } = req.params;
  const { state } = req.query;
  
  if (!state || !oauthStates.has(state)) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }
  
  passport.authenticate(provider, { failureRedirect: '/auth/error' })(req, res, (err) => {
    if (err) return next(err);
    handleOAuthCallback(req, res);
  });
});

function handleOAuthCallback(req, res) {
  const state = req.query.state;
  const stateData = oauthStates.get(state);
  
  if (!stateData) {
    return res.redirect('http://localhost:5173/integrations?error=invalid_state');
  }
  
  const { provider, integration_id, redirect_client, requestedScopes } = stateData;
  
  // Store credentials temporarily with a unique ID
  const credentialId = uuidv4();
  const credentials = {
    provider,
    integration_id,
    user: req.user,
    requestedScopes,
    timestamp: Date.now()
  };
  
  tempCredentials.set(credentialId, credentials);
  
  // Clean up state
  oauthStates.delete(state);
  
  // Redirect back to client with credential ID
  res.redirect(`${redirect_client || 'http://localhost:5173/integrations'}/${integration_id}?credential_id=${credentialId}`);
}

// Error route
app.get('/auth/error', (req, res) => {
  res.redirect('http://localhost:5173/integrations?error=auth_failed');
});

// Helper function to encrypt sensitive data
function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

// Helper function to decrypt sensitive data
function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Helper function to save credentials to database
async function saveCredentialsToDatabase(userId, integrationId, name, data) {
  try {
    // Encrypt sensitive data
    const encryptedData = {
      ...data,
      access_token: data.access_token ? encryptData(data.access_token) : null,
      refresh_token: data.refresh_token ? encryptData(data.refresh_token) : null,
    };

    // Save to database
    const { data: savedCredential, error } = await supabase
      .from('credentials')
      .insert([
        {
          user_id: userId,
          integration_id: integrationId,
          name: name || `${data.provider.charAt(0).toUpperCase() + data.provider.slice(1)} Connection`,
          data: encryptedData
        }
      ])
      .select();

    if (error) {
      console.error('Error saving credentials to database:', error);
      throw error;
    }

    return savedCredential[0];
  } catch (error) {
    console.error('Error in saveCredentialsToDatabase:', error);
    throw error;
  }
}

// API to retrieve stored credentials
app.get('/api/credentials/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!tempCredentials.has(id)) {
    return res.status(404).json({ error: 'Credentials not found or expired' });
  }
  
  const credentials = tempCredentials.get(id);
  
  // In a real app, you would verify the user is authorized to access these credentials
  
  // Format the credentials for the client
  const formattedCredentials = {
    provider: credentials.provider,
    integration_id: credentials.integration_id,
    access_token: credentials.user.accessToken,
    refresh_token: credentials.user.refreshToken || '',
    user_id: credentials.user.id,
    user_name: credentials.user.displayName || '',
    user_email: credentials.user.email || '',
    expires_at: credentials.user.params?.expires_at || null,
    scope: credentials.user.params?.scope || '',
    scopes: credentials.requestedScopes || [],
    token_type: credentials.user.params?.token_type || 'Bearer'
  };
  
  try {
    // Save credentials to database with encryption
    if (req.query.save === 'true' && req.query.userId) {
      const credentialName = req.query.name || `${formattedCredentials.provider.charAt(0).toUpperCase() + formattedCredentials.provider.slice(1)} Connection`;
      await saveCredentialsToDatabase(
        req.query.userId,
        formattedCredentials.integration_id,
        credentialName,
        formattedCredentials
      );
    }
  } catch (error) {
    console.error('Error saving credentials:', error);
    // Continue to return credentials even if saving fails
  }
  
  // Delete the temporary credentials after retrieval
  tempCredentials.delete(id);
  
  res.json(formattedCredentials);
});

// Add an endpoint to get available Google scopes
app.get('/api/google/scopes', (req, res) => {
  const googleScopes = {
    default: OAUTH_SCOPES.google.default,
    services: {
      gmail: {
        name: 'Gmail',
        scopes: OAUTH_SCOPES.google.gmail,
        description: 'Access to Gmail for sending and reading emails'
      },
      sheets: {
        name: 'Google Sheets',
        scopes: OAUTH_SCOPES.google.sheets,
        description: 'Access to Google Sheets for reading and writing data'
      },
      drive: {
        name: 'Google Drive',
        scopes: OAUTH_SCOPES.google.drive,
        description: 'Access to Google Drive for file management'
      },
      calendar: {
        name: 'Google Calendar',
        scopes: OAUTH_SCOPES.google.calendar,
        description: 'Access to Google Calendar for event management'
      },
      youtube: {
        name: 'YouTube',
        scopes: OAUTH_SCOPES.google.youtube,
        description: 'Access to YouTube for video management and analytics'
      }
    }
  };
  
  res.json(googleScopes);
});

// Add an endpoint to get available scopes for any provider
app.get('/api/provider/:provider/scopes', (req, res) => {
  const { provider } = req.params;
  
  if (!OAUTH_SCOPES[provider]) {
    return res.status(404).json({ error: `Provider ${provider} not found` });
  }
  
  const providerScopes = {
    default: OAUTH_SCOPES[provider].default
  };
  
  // Add categories for each provider
  if (provider === 'google') {
    providerScopes.categories = {
      gmail: {
        name: 'Gmail',
        scopes: OAUTH_SCOPES.google.gmail,
        description: 'Access to Gmail for sending and reading emails'
      },
      sheets: {
        name: 'Google Sheets',
        scopes: OAUTH_SCOPES.google.sheets,
        description: 'Access to Google Sheets for reading and writing data'
      },
      drive: {
        name: 'Google Drive',
        scopes: OAUTH_SCOPES.google.drive,
        description: 'Access to Google Drive for file management'
      },
      calendar: {
        name: 'Google Calendar',
        scopes: OAUTH_SCOPES.google.calendar,
        description: 'Access to Google Calendar for event management'
      },
      youtube: {
        name: 'YouTube',
        scopes: OAUTH_SCOPES.google.youtube,
        description: 'Access to YouTube for video management and analytics'
      }
    };
  } else if (provider === 'github') {
    providerScopes.categories = {
      repos: {
        name: 'Repositories',
        scopes: OAUTH_SCOPES.github.repos,
        description: 'Access to public and private repositories'
      },
      admin: {
        name: 'Administration',
        scopes: OAUTH_SCOPES.github.admin,
        description: 'Administrative access to organizations and webhooks'
      },
      notifications: {
        name: 'Notifications',
        scopes: OAUTH_SCOPES.github.notifications,
        description: 'Access to notifications and discussions'
      }
    };
  } else if (provider === 'slack') {
    providerScopes.categories = {
      messages: {
        name: 'Messages',
        scopes: OAUTH_SCOPES.slack.messages,
        description: 'Send messages to channels and users'
      },
      channels: {
        name: 'Channels',
        scopes: OAUTH_SCOPES.slack.channels,
        description: 'Access to channel information and history'
      },
      users: {
        name: 'Users',
        scopes: OAUTH_SCOPES.slack.users,
        description: 'Access to user information and profiles'
      },
      files: {
        name: 'Files',
        scopes: OAUTH_SCOPES.slack.files,
        description: 'Access to files and file management'
      }
    };
  } else if (provider === 'facebook') {
    providerScopes.categories = {
      pages: {
        name: 'Pages',
        scopes: OAUTH_SCOPES.facebook.pages,
        description: 'Access to Facebook Pages information'
      },
      publishing: {
        name: 'Publishing',
        scopes: OAUTH_SCOPES.facebook.publishing,
        description: 'Publish content to Facebook Pages'
      },
      instagram: {
        name: 'Instagram',
        scopes: OAUTH_SCOPES.facebook.instagram,
        description: 'Access to connected Instagram accounts'
      }
    };
  }
  
  res.json(providerScopes);
});

// Helper functions
function getProviderConfig(provider) {
  // In a real app, these would come from your database
  const configs = {
    github: {
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profileURL: 'https://api.github.com/user'
    },
    slack: {
      authorizationURL: 'https://slack.com/oauth/v2/authorize',
      tokenURL: 'https://slack.com/api/oauth.v2.access',
      clientID: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      profileURL: 'https://slack.com/api/users.identity'
    },
    facebook: {
      authorizationURL: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      profileURL: 'https://graph.facebook.com/v18.0/me?fields=id,name,email'
    }
  };
  
  return configs[provider];
}

// Start the server
app.listen(PORT, () => {
  console.log(`OAuth server running on http://localhost:${PORT}`);
});