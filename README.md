# Finance Tracker

> Simple tool to monitor bank accounts with cool statistics

## Installation

To install Finance Tracker locally, you can run the following commands:

```sh
git clone https://github.com/Av32000/Finance-Tracker
cd Finance-Tracker
pnpm install
pnpm build
```

After these steps, you have two options:

### Docker Hosting

Using Docker is the easiest method to run Finance Tracker. Docker Compose will create, set up, and host a PostgreSQL database without additional configuration steps.

To use Docker hosting, run the following commands:

```sh
POSTGRES_PASSWORD="<your_password>" # Replace this with a custom password for the database
echo $'POSTGRES_USER="postgres"\nPOSTGRES_PASSWORD="$POSTGRES_PASSWORD"\nPOSTGRES_DB="ft"' >> .env
docker compose build
docker compose up
```

You're ready to open `http://localhost:3000` and start using Finance Tracker.

### Classic Hosting

It's possible to run Finance Tracker without using a Docker container. First, you need to set up a PostgreSQL database and obtain a connection string. Then, you can run the following commands:

```sh
DATABASE_URL="<your_connection_string>" # Replace this with the connection string of your PostgreSQL database
echo "DATABASE_URL=$DATABASE_URL" >> .env
pnpm prisma:push
pnpm generate-keys
pnpm start
```

You're ready to open `http://localhost:3000` and start using Finance Tracker.

## Contributing

All contributions are greatly appreciated. Feel free to fork this repository and open pull requests to enhance the project.

## Disclaimer

> [!CAUTION] Finance Tracker is a side project and is not intended for use in production or with important or sensitive data. The authors of this software decline all responsibility for the data stored, managed, or processed by the software. Use it at your own risk.
