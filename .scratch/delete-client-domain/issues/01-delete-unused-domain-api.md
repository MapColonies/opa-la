# 01 — Delete an unused domain through the API

**What to build:** An operator can delete a domain through the auth-manager API, but
only when the domain is not **in use**: no connection version, in any environment,
lists it. Enabled or disabled connections both count. A delete that goes through is
permanent. A refused delete changes nothing and says why.

This is the first DELETE endpoint in auth-manager, so it sets the pattern: the manager
throws typed errors, the controller maps them to HTTP statuses (like
`DomainAlreadyExistsError` → 409), and the usage check plus the delete happen in one
conditional delete statement. If nothing was deleted, a follow-up lookup decides
between "not found" and "in use". No locking, no schema changes. See the spec for the
accepted race with concurrent connection saves.

Spec: `.scratch/delete-client-domain/spec.md`. Delivered in the API PR
(`feat/delete-client-domain-api`, based on `origin/master`).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] The OpenAPI spec declares `DELETE /domain/{domainName}` with `204`, `404` and `409` responses (plus the usual `400`/`500`). The `409` body is the standard error shape with a plain message, not a list of connections
- [ ] Deleting an unused domain returns `204`, and the domain no longer appears in `GET /domain`
- [ ] Deleting a domain that doesn't exist returns `404`
- [ ] Deleting a domain listed by a connection in the same environment returns `409`, and the domain still exists
- [ ] Deleting a domain listed only by a connection in a different environment returns `409`
- [ ] Deleting a domain listed only by an older connection version returns `409`
- [ ] Deleting a domain listed only by a disabled connection returns `409`
- [ ] A connection listing several domains blocks the delete of each of them
- [ ] All cases are added to the existing domain integration spec, run against a real database, and every response satisfies the OpenAPI spec
