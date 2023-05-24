# `auth-cron`
A server for creating and uploading OPA bundles based on a schedule.
## Configuration
The configuration for the server is made from two main parts - Database configuration and Cron configuration.
For reference the schema of the configuration can be found in the following [file](src/config.ts). 

### Database configuration
This section includes the connection details to the database.
It should be the same database used by the auth-manager API.

Before connecting, make sure you run the migrations to update the database.
The configuration is as follows:
```json
{
  "db": {
    "host": "postgres",
    "schema": "auth_manager",
    "username": "postgres",
    "password": "1234",
    "database": "postgres",
    "enableSslAuth": false
  }
}
```

### Cron configuration
This configuration sections defines the environment for which bundles will be created. You can configure when the bundles will be created and where they will be store.

For the server to run at least one of the following environments needs to be defined: np, stage, prod. If none is defined the server will fail to start.

The configuration is as follows:
```json
{
  "cron": {
    "np": {
      "pattern": "*/30 * * * * *",
      "s3": {
        "accessKey": "minioadmin",
        "secretKey": "minioadmin",
        "endpoint": "http://localhost:9000",
        "bucket": "auth-cron-tests",
        "key": "np-bundle.tar.gz"
      }
    }
  }
}
```
  