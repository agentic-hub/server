# Getting Started with Deno CORS Server

This guide will help you quickly set up and run a Deno server with CORS support.

## Quick Start

1. **Install Deno** (if not already installed):
   ```bash
   # macOS or Linux
   curl -fsSL https://deno.land/x/install/install.sh | sh
   
   # Windows (PowerShell)
   iwr https://deno.land/x/install/install.ps1 -useb | iex
   ```

2. **Run the server**:
   ```bash
   deno task start
   ```

3. **Test the API**:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"name":"Your Name"}' http://localhost:8000
   ```

## Project Overview

- `index.ts`: Main server file that handles requests
- `_shared/cors.ts`: CORS headers configuration for cross-origin requests
- `deno.json`: Deno configuration and tasks

## Development

To modify the server:

1. Edit `index.ts` to change the API behavior
2. Edit `_shared/cors.ts` to adjust CORS settings
3. Restart the server with `deno task start`

## CORS Support

This server includes built-in CORS headers to allow cross-origin requests from browsers, making it ideal for frontend development.
