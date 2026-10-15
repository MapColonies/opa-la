# 02 — Delete an unused client through the API

**What to build:** An operator can delete a client through the auth-manager API, but
only when the client is not **in use**: it has no connection version in any
environment. Enabled or disabled connections both count. Same contract and the same
typed-error / conditional-delete pattern as ticket 01, applied to clients.

Spec: `.scratch/delete-client-domain/spec.md`. Delivered in the API PR
(`feat/delete-client-domain-api`), alongside ticket 01.

**Blocked by:** 01 — Delete an unused domain through the API (it sets the pattern and edits the same OpenAPI file)

**Status:** ready-for-agent

- [ ] The OpenAPI spec declares `DELETE /client/{clientName}` with `204`, `404` and `409` responses (plus the usual `400`/`500`), matching the domain delete contract
- [ ] Deleting a client with no connections returns `204`, and `GET /client/{clientName}` then returns `404`
- [ ] Deleting a client that doesn't exist returns `404`
- [ ] Deleting a client with a connection in any environment returns `409`, and the client still exists
- [ ] Deleting a client whose only connection is an older version, or a disabled one, returns `409`
- [ ] All cases are added to the existing client integration spec, run against a real database, and every response satisfies the OpenAPI spec
