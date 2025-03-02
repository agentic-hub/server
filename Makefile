# AI Agent MPC Hub Makefile
# This Makefile simplifies common development tasks

.PHONY: setup install dev server build lint db-setup db-push clean help deploy deploy-frontend deploy-functions

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_BIN = node_modules/.bin

# Setup environment
setup: ## Setup environment variables
	@echo "Setting up environment variables..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example. Please update with your credentials."; \
	else \
		echo ".env file already exists."; \
	fi

# Install dependencies
install: ## Install project dependencies
	@echo "Installing dependencies..."
	npm install

# Start development server (frontend)
dev: ## Start the frontend development server
	@echo "Starting frontend development server..."
	npm run dev

# Start OAuth server
server: ## Start the OAuth server
	@echo "Starting OAuth server..."
	npm run server

# Start OAuth server with proper environment variables
oauth-server: ## Start the OAuth server with proper environment variables
	@echo "Starting OAuth server with proper environment variables..."
	@echo "Make sure you have set up your .env file with the required OAuth credentials"
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Run 'make setup' first."; \
		exit 1; \
	fi
	npm run server

# Start both servers concurrently
start: ## Start both frontend and OAuth servers
	@echo "Starting both frontend and OAuth servers..."
	@if command -v concurrently > /dev/null; then \
		concurrently "npm run dev" "npm run server"; \
	else \
		echo "concurrently not found. Starting servers in separate terminals..."; \
		npm run dev & npm run server; \
	fi

# Build the project
build: ## Build the project for production
	@echo "Building project for production..."
	npm run build

# Run linting
lint: ## Run linting
	@echo "Running linter..."
	npm run lint

# Setup Supabase
db-setup: ## Setup Supabase CLI and link project
	@echo "Setting up Supabase..."
	@if ! command -v supabase > /dev/null; then \
		echo "Installing Supabase CLI..."; \
		npm install -g supabase; \
	fi
	@echo "Please run 'supabase login' and 'supabase link --project-ref YOUR_PROJECT_REF' manually"

# Push database migrations
db-push: ## Push database migrations to Supabase
	@echo "Pushing database migrations to Supabase..."
	supabase db push

# Deploy frontend application
deploy-frontend: build ## Build and deploy the frontend application
	@echo "Deploying frontend application..."
	@echo "This is a placeholder. Replace with your actual frontend deployment command."
	@echo "For example: rsync -avz --delete dist/ user@server:/path/to/deployment/"

# Deploy Supabase Edge Functions
deploy-functions: ## Deploy Supabase Edge Functions
	@echo "Deploying Supabase Edge Functions..."
	@if ! command -v supabase > /dev/null; then \
		echo "Error: Supabase CLI not found. Run 'make db-setup' first."; \
		exit 1; \
	fi
	supabase functions deploy oauth

# Deploy everything
deploy: deploy-frontend deploy-functions ## Deploy both frontend and Supabase functions
	@echo "Deployment completed successfully!"

# Clean build artifacts
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf dist
	rm -rf .temp

# Help command
help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' 