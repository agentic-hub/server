# AI Agent MPC Hub Makefile
# This Makefile simplifies common development tasks

.PHONY: setup install dev server build lint db-setup db-push clean help deploy deploy-frontend deploy-functions deploy-supabase supabase-setup supabase-start supabase-stop supabase-restart supabase-logs supabase-clean supabase-status

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_BIN = node_modules/.bin
REPO_URL = https://github.com/agentic-hub/agentic-hub.github.io.git
SUPABASE_FLAGS = --experimental

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
	@echo "Setting base URL for GitHub Pages deployment..."
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

# Deploy frontend application to GitHub Pages
deploy-frontend: build ## Build and deploy the frontend application to GitHub Pages
	@echo "Deploying frontend application to GitHub Pages..."
	@if ! command -v gh > /dev/null; then \
		echo "Error: GitHub CLI not found. Please install it first: https://cli.github.com/"; \
		exit 1; \
	fi
	@echo "Creating .nojekyll file to bypass Jekyll processing..."
	touch dist/.nojekyll
	@echo "Creating CNAME file for agentic-hub.github.io..."
	echo "agentic-hub.github.io" > dist/CNAME
	@echo "Deploying to GitHub Pages..."
	npx gh-pages -d dist -r $(REPO_URL) -b main -m "Deploy to GitHub Pages [skip ci]"
	@echo "Deployment complete! Your site will be available at https://agentic-hub.github.io/"

# Deploy frontend to Supabase Storage
deploy-supabase: build ## Build and deploy the frontend application to Supabase Storage
	@echo "Deploying frontend application to Supabase Storage..."
	@if ! command -v supabase > /dev/null; then \
		echo "Error: Supabase CLI not found. Run 'make db-setup' first."; \
		exit 1; \
	fi
	@echo "Checking if project is linked to Supabase..."
	@if [ ! -f supabase/.temp/project-ref ]; then \
		echo "Error: Supabase project not linked. Run 'supabase link --project-ref YOUR_PROJECT_REF' first."; \
		exit 1; \
	fi
	@echo "Deploying static files to Supabase Storage..."
	@echo "Creating www bucket if it doesn't exist..."
	-supabase $(SUPABASE_FLAGS) storage create www
	@echo "Setting up public access for the www bucket..."
	-supabase $(SUPABASE_FLAGS) storage update www --public
	@echo "Uploading index.html..."
	supabase $(SUPABASE_FLAGS) storage cp dist/index.html ss:///www/index.html
	@echo "Uploading assets..."
	find dist/assets -type f | while read file; do \
		relative_path=$${file#dist/}; \
		echo "Uploading $$relative_path..."; \
		supabase $(SUPABASE_FLAGS) storage cp "$$file" "ss:///www/$$relative_path"; \
	done
	@echo "Deployment complete! Your site will be available at:"
	@echo "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/www/index.html"
	@echo "Note: Replace YOUR_PROJECT_ID with your actual Supabase project ID"

# Deploy Supabase Edge Functions
deploy-functions: ## Deploy Supabase Edge Functions
	@echo "Deploying Supabase Edge Functions..."
	@if ! command -v supabase > /dev/null; then \
		echo "Error: Supabase CLI not found. Run 'make db-setup' first."; \
		exit 1; \
	fi
	supabase functions deploy oauth
	supabase functions deploy api
# Deploy everything
deploy: deploy-functions ## Deploy both frontend and Supabase functions
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

# Supabase Docker Compose Management
# Variables for Supabase Docker
SUPABASE_ENV_FILE := .env.supabase
DOCKER_COMPOSE_FILE := docker-compose.yml

# Setup directories and initial configuration for Supabase Docker
supabase-setup: ## Create necessary directories for Supabase Docker
	@echo "Setting up Supabase directories..."
	mkdir -p volumes/db/data volumes/storage volumes/kong
	@echo "Setup complete. You can now start Supabase with 'make supabase-start'"

# Start Supabase services
supabase-start: ## Start all Supabase Docker services
	@echo "Starting Supabase services..."
	export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) up -d
	@echo "Supabase is now running!"
	@echo "Studio UI: http://localhost:3000"
	@echo "API Endpoint: http://localhost:8000"

# Stop Supabase services
supabase-stop: ## Stop all Supabase Docker services
	@echo "Stopping Supabase services..."
	export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) down
	@echo "Supabase services stopped."

# Restart Supabase services
supabase-restart: ## Restart all Supabase Docker services
	@echo "Restarting Supabase services..."
	export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) restart
	@echo "Supabase services restarted."

# View logs for all or a specific service
supabase-logs: ## View logs for all Supabase services or a specific one (use service=<name>)
	@if [ "$(service)" = "" ]; then \
		echo "Showing logs for all services..."; \
		export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f; \
	else \
		echo "Showing logs for $(service)..."; \
		export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f $(service); \
	fi

# Clean up volumes and data
supabase-clean: ## Remove all Supabase Docker data and volumes
	@echo "WARNING: This will remove all Supabase data. Are you sure? [y/N]"
	@read -r response; \
	if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		echo "Removing Supabase services and volumes..."; \
		export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) down -v; \
		echo "Removing volume directories..."; \
		rm -rf volumes/db/data volumes/storage; \
		echo "Cleanup complete."; \
	else \
		echo "Operation cancelled."; \
	fi

# Check status of Supabase services
supabase-status: ## Check status of Supabase Docker services
	@echo "Checking Supabase services status..."
	export $$(cat $(SUPABASE_ENV_FILE) | xargs) && docker-compose -f $(DOCKER_COMPOSE_FILE) ps 