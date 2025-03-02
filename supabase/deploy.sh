#!/bin/bash

# Deploy Supabase Edge Functions

echo "Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Login to Supabase (if not already logged in)
supabase login

# Link to project (if not already linked)
if [ ! -f "./supabase/.temp/project-ref" ]; then
    echo "Project not linked. Please enter your Supabase project reference:"
    read project_ref
    supabase link --project-ref $project_ref
fi

# Deploy functions
echo "Deploying OAuth function..."
supabase functions deploy oauth --no-verify-jwt

echo "Deploying API function..."
supabase functions deploy api --no-verify-jwt

echo "Deployment complete!" 