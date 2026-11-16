# Employee Records

This Employee Records app lets you create, view, search, edit, and delete employee records. Search matches partial names and employee IDs without regard to capitalization. Each record has a name, employee ID, and an optional role. There is no account system or role-based access yet.

## Requirements

- Node.js and npm
- PostgreSQL

## Set up the database

The app connects to PostgreSQL on `localhost:5432` using the `admin` database user and `RecordDB` database by default. These defaults can be changed with `PGUSER`, `PGHOST`, `PGDATABASE`, `PGPASSWORD`, and `PGPORT`. It creates the `records` table the first time it starts and does not delete or modify existing tables.

In pgAdmin, look under **Servers > PostgreSQL > Databases** to see your database names. Reuse an existing database if desired, or create one matching the app's default (`RecordDB`):

1. Open pgAdmin and connect to your local PostgreSQL server.
2. Right-click **Databases**, choose **Create > Database...**, enter `RecordDB`, and save.
3. If your PostgreSQL username or database name differs from the defaults, set `PGUSER` and `PGDATABASE` in the terminal before starting the app. Set `PGPASSWORD` if your user requires a password.

You can open pgAdmin from the Windows Start menu. To use the PostgreSQL command line instead, open SQL Shell (psql), connect to your server, and run `CREATE DATABASE "RecordDB";`.

## Run the app on Windows

Open PowerShell in this project folder and run:

```powershell
npm install
# Set these if your local PostgreSQL settings differ from the defaults:
# $env:PGDATABASE = "RecordDB"
# $env:PGUSER = "admin"
# $env:PGPASSWORD = "your-postgres-password"
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. Keep the PowerShell window open while using the app; press Ctrl+C to stop the server.