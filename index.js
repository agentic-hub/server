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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage for OAuth states and credentials
// In a production app, you would use a database
const oauthStates = new Map();
const tempCredentials = new Map();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3001',
      'https://agentic-hub.github.io'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  const { integration_id, redirect_client } = req.query;
  
  // Generate a state parameter to prevent CSRF
  const state = uuidv4();
  
  // Store state with metadata
  oauthStates.set(state, {
    provider,
    integration_id,
    redirect_client,
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
app.get('/auth/google', passport.authenticate('google', { 
  scope: getGoogleScopes(),
  accessType: 'offline',
  prompt: 'consent'
}));

app.get('/auth/:provider', (req, res, next) => {
  const { provider } = req.params;
  const { state } = req.query;
  
  if (provider !== 'google' && oauthStates.has(state)) {
    passport.authenticate(provider, {
      scope: getProviderScopes(provider),
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
  
  const { provider, integration_id, redirect_client } = stateData;
  
  // Store credentials temporarily with a unique ID
  const credentialId = uuidv4();
  const credentials = {
    provider,
    integration_id,
    user: req.user,
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

// API to retrieve stored credentials
app.get('/api/credentials/:id', (req, res) => {
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
    token_type: credentials.user.params?.token_type || 'Bearer'
  };
  
  // Delete the temporary credentials after retrieval
  tempCredentials.delete(id);
  
  res.json(formattedCredentials);
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
      authorizationURL: 'https://www.facebook.com/v12.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v12.0/oauth/access_token',
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      profileURL: 'https://graph.facebook.com/me?fields=id,name,email'
    }
  };
  
  return configs[provider];
}

function getGoogleScopes() {
  return ['profile', 'email'];
}

function getProviderScopes(provider) {
  const scopes = {
    github: ['user:email', 'read:user'],
    slack: ['users:read', 'chat:write', 'channels:read'],
    facebook: ['email', 'public_profile']
  };
  
  return scopes[provider] || [];
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});