# End to end example

_Before starting make sure you have auth-manager and auth-cron deployed._

1. Post all the files in the data folder into the auth-manager api.

2. Deploy OPA cli as a server. `opa run -s -c opa.yaml`

3. Deploy nginx with the files in the nginx folder.

4. Make requests to OPA and check if they are authenticated or not.
