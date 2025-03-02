# Local Supabase Setup

This repository contains a Docker Compose configuration for running Supabase locally.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (to clone this repository)

## Getting Started

1. Make sure Docker is running on your machine.

2. Create the necessary directories for volumes:

```bash
mkdir -p volumes/db/data volumes/storage volumes/kong
```

3. Copy the Kong configuration file:

```bash
# The kong.yml file should already be in the volumes/kong directory
```

4. Start the Supabase services:

```bash
# Load environment variables from .env.supabase
export $(cat .env.supabase | xargs)

# Start the services
docker-compose up -d
```

5. Access the Supabase Studio at [http://localhost:3000](http://localhost:3000)

## Services

The following services are included in this setup:

- **Supabase Studio**: A web-based UI for managing your Supabase project (port 3000)
- **Kong API Gateway**: Routes requests to the appropriate services (port 8000)
- **PostgreSQL Database**: The main database (port 5432)
- **GoTrue**: Authentication service
- **PostgREST**: RESTful API for PostgreSQL
- **Realtime**: Real-time subscriptions
- **Storage**: File storage service
- **pg-meta**: PostgreSQL metadata service

## Environment Variables

The following environment variables are used in this setup:

- `POSTGRES_PASSWORD`: Password for the PostgreSQL database
- `ANON_KEY`: Anonymous key for public access
- `SERVICE_ROLE_KEY`: Service role key for privileged access
- `JWT_SECRET`: Secret for JWT token generation

These are defined in the `.env.supabase` file.

## Connecting to the Database

You can connect to the PostgreSQL database using the following connection details:

- Host: localhost
- Port: 5432
- Database: postgres
- Username: postgres
- Password: postgres (or whatever you set in the .env.supabase file)

## Stopping the Services

To stop the services, run:

```bash
docker-compose down
```

To stop the services and remove the volumes (this will delete all data):

```bash
docker-compose down -v
```

## Troubleshooting

If you encounter any issues:

1. Check that all required ports (3000, 8000, 5432) are available and not used by other services.
2. Ensure Docker has enough resources allocated (memory, CPU).
3. Check the logs for specific services:

```bash
docker-compose logs studio  # For Supabase Studio logs
docker-compose logs db      # For database logs
docker-compose logs kong    # For API gateway logs
```

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase GitHub Repository](https://github.com/supabase/supabase) 