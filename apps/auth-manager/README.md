# `auth-manager`

## Note about tokens and connections

When creating or updating a connection, a token will be generated automatically based on the private key.
If for any reason the token generation failed, or no private key existed, the token field will be an empty string, and the reason will be logged.

## Running migrations

When you want to deploy the service, you need to run the database migrations before you can use the service.
The docker image already contains all the necessary tools to run the migrations.

For example:

```sh
docker run --rm --network=host --entrypoint=npm auth-manager run migration:run
```

Do not forget to also supply the required configuration by using environment variables or file.
