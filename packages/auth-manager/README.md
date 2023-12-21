# `auth-manager`

## Note about tokens and connections

When creating or updating a connection, a token will be generated automatically based on the private key.
If for any reason the token generation failed, or no private key existed, the token field will be an empty string, and the reason will be logged.
