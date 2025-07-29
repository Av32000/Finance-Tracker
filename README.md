# Finance Tracker

> Simple tool to monitor bank accounts with cool statistics

## Installation

To install Finance Tracker locally, you can clone the repo with the following commands:

```sh
git clone https://github.com/Av32000/Finance-Tracker
cd Finance-Tracker
```

After these steps, you have two options:

### Docker Hosting

Using Docker is the easiest method to run Finance Tracker. Docker Compose will create, set up, and host a PostgreSQL database without additional configuration steps.

To use Docker hosting, run the following commands:

```sh
POSTGRES_PASSWORD="<your_password>" # Replace this with a custom password for the database
echo -e "POSTGRES_USER=postgres\nPOSTGRES_PASSWORD=$POSTGRES_PASSWORD\nPOSTGRES_DB=ft" >> .env
docker compose --env-file .env up
```

You're ready to open `http://localhost:3000` and start using Finance Tracker.

### Classic Hosting

It's possible to run Finance Tracker without using a Docker container. First, you need to set up a PostgreSQL database and obtain a connection string. Then, you can run the following commands:

```sh
# Setup env variables
DATABASE_URL="<your_connection_string>" # Replace this with the connection string of your PostgreSQL database
echo "DATABASE_URL=$DATABASE_URL" >> .env

# Install dependencies
pnpm install
pnpm prisma:generate

# Build project and init database
pnpm build
pnpm prisma:push
pnpm generate-keys

# Start Finance-Tracker
pnpm start:prod
```

You're ready to open `http://localhost:3000` and start using Finance Tracker.

### Standalone Binary

Finance Tracker can be built as a standalone binary distribution that includes everything needed to run the application:

```sh
# Build the standalone binary
pnpm build:binary

# Run the binary (from the bin/ directory)
cd bin
./finance-tracker

# Run with custom options
./finance-tracker --port=8080 --host=0.0.0.0
./finance-tracker --data-dir="/path/to/custom/directory"
```

The standalone binary:
- Includes the Node.js runtime for complete portability
- Automatically runs in standalone mode (offline + user config directory)  
- Stores data in your user configuration directory (`~/.config/finance-tracker` on Linux, `~/Library/Application Support/finance-tracker` on macOS, `%APPDATA%/finance-tracker` on Windows)
- Can be distributed as a single directory containing all necessary files
- Supports all command line options: `--port`, `--host`, `--data-dir`, `--insecure`

## Contributing

All contributions are greatly appreciated. Feel free to fork this repository and open pull requests to enhance the project.

## Disclaimer

> [!CAUTION]
> Finance Tracker is a side project and is not intended for use in production or with important or sensitive data. The authors of this software decline all responsibility for the data stored, managed, or processed by the software. Use it at your own risk.
