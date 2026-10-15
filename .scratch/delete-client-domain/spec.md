# Delete unused clients and domains

Status: ready-for-agent

## Problem Statement

Operators of the authorization stack can create clients and domains, but never remove
them. A client created by mistake, a typo in a domain name, or a domain that was
planned and never granted stays in the lists for good. The lists fill up, and they no
longer reflect which clients and domains are real. Today the only way to clean up is
a hand-written SQL delete, and nothing then stops someone from deleting a client or
domain that a connection still refers to.

## Solution

Operators can delete a client or a domain, from the API and from the UI, as long as
it is not **in use**:

- A client is in use if it has any connection version in any environment.
- A domain is in use if any connection version in any environment lists it.

Enabled or disabled makes no difference. A delete that is refused says why, and
nothing changes. A delete that goes through is permanent.

In the UI, every row in the clients and domains tables gets a Delete action. The
operator confirms, the delete runs on the current site, and then (as with create and
edit) the operator may choose other sites to send the same delete to. Each site
reports its own result.

## User Stories

1. As an operator, I want to delete a client that has no connections, so that clients created by mistake don't stay in the list.
2. As an operator, I want to delete a domain that no connection lists, so that misspelled or abandoned domains don't stay in the list.
3. As an operator, I want deleting a client that has connections to be refused, so that no connection is left belonging to a client that doesn't exist.
4. As an operator, I want deleting a domain listed by a connection to be refused, so that no connection is left granting a domain that doesn't exist.
5. As an operator, I want a client to count as in use even if its only connections are in another environment, so that one environment's cleanup can't break another.
6. As an operator, I want a client or domain to count as in use even if only an older connection version refers to it, so that past bundles, which record exact connection versions, keep pointing at real records.
7. As an operator, I want disabled connections to count as usage, so that re-enabling a connection never brings back a dangling reference.
8. As an operator, I want a clear message when a delete is refused because of usage, so that I know to look at the connections first.
9. As an operator, I want deleting a client or domain that doesn't exist to say it wasn't found, so that I can tell a typo from a refusal.
10. As an operator, I want a successful delete to return no body, so that the API stays consistent with standard REST delete semantics.
11. As an API consumer, I want the delete endpoints described in the OpenAPI spec, so that typed clients and request validation cover them like every other endpoint.
12. As an operator using the UI, I want a Delete action on every row of the clients table, next to Edit, so that I can remove a client where I already manage it.
13. As an operator using the UI, I want a Delete action on every row of the domains table, so that I can remove a domain where I already see it.
14. As an operator using the UI, I want to confirm before anything is deleted, so that a misclick doesn't permanently remove a record.
15. As an operator using the UI, I want the confirmation to name the client or domain being deleted, so that I know exactly what I'm confirming.
16. As an operator using the UI, I want a refused delete to show the server's message inside the dialog, so that I see why without hunting for it.
17. As an operator using the UI, I want the list to refresh after a successful delete, so that the deleted row disappears without reloading the page.
18. As an operator using the UI, I want to send a successful delete to other sites, so that I can clean up every site from one place, as I can when creating and editing.
19. As an operator using the UI, I want each site's delete result shown separately, so that I know which sites still have the record (because it is in use there, or was never there).
20. As an operator using the UI, I want to skip sending to other sites and just close, so that a delete meant for one site stays on that site.
21. As an operator using the UI, I want the delete button disabled while a delete is in progress, so that I can't send the same delete twice.

## Implementation Decisions

**Domain language**

- "In use" is defined in `CONTEXT.md`. Both API and UI use it in messages and naming.

**API contract (auth-openapi)**

- New operation `DELETE /client/{clientName}` (operation id along the lines of `deleteClient`).
- New operation `DELETE /domain/{domainName}` (operation id along the lines of `deleteDomain`). This adds the first item-level path under `/domain`.
- Responses for both:
  - `204 No Content`: deleted.
  - `404 Not Found`: no client or domain by that name.
  - `409 Conflict`: in use. The body is the standard error shape with a plain message (e.g. "domain is in use by connections"). It does **not** list the connections causing the conflict.
  - Plus the usual `400`/`500` responses that other operations declare.

**auth-manager**

- The client and domain modules each get a delete operation in their manager, controller and router, following the existing create flow: the manager throws typed errors, and the controller maps them to HTTP statuses (the same way `DomainAlreadyExistsError` becomes 409).
- New typed errors: one for "not found" and one for "in use", per resource.
- The usage check and the delete are one conditional delete statement: delete the row only if no connection refers to it.
  - Client: no connection row whose name equals the client name.
  - Domain: no connection row whose domains array contains the domain.
  - Every environment and every version counts.
- If the statement deletes nothing, a follow-up lookup decides whether the record doesn't exist (404) or is in use (409).
- No foreign keys and no schema or migration changes. Connections still refer to clients by name and to domains through their domains array.
- **Race accepted:** no locking is added. A connection save that validated a domain or client just before a concurrent delete can still land and refer to it. The window is tiny in a manually operated admin tool, and closing it would mean changing the connection-save path.

**auth-ui**

- The clients table gets a Delete button in its existing actions column, next to Edit. The domains table gets a new actions column with a Delete button.
- Deleting opens a two-step modal that mirrors the create modals:
  1. **Confirm step:** names the record and warns that the delete is permanent. Confirm sends the DELETE to the current site. While it runs, the button is disabled. A 409 or 404 shows the server's message as a destructive alert in the modal, and the modal stays on this step. A 204 shows a success alert and invalidates the list query so the row disappears.
  2. **Send step:** only reached after a local success, and only if other sites exist. It uses the existing site selection component. Sending runs the same DELETE against each selected site's API in parallel and shows a success or error result per site. It also shows toasts listing which sites succeeded and which failed, the same as create and edit.
- If the local delete is refused, the send step is never offered. This matches create and edit, where the send step also only opens after a local success. To delete on a site where the record is not in use, the operator switches to that site.
- The UI never asks whether a record is in use ahead of time. The API's 409 is the only source of truth.

**Delivery**

- Two stacked PRs, managed with `gh stack`, based on `origin/master`. There is no Jira ticket.
  1. `feat/delete-client-domain-api`: OpenAPI contract, auth-manager and their tests. Title: `feat(auth-manager): delete unused clients and domains`.
  2. `feat/delete-client-domain-ui`: the auth-ui changes and their tests, stacked on PR 1. Title: `feat(auth-ui): delete unused clients and domains`.

## Testing Decisions

- Good tests here drive the feature only through its outermost interface and assert on what an outside caller can observe: HTTP status, response body, what a later request returns, what the user sees on screen. They never call managers directly or assert on internal SQL. No new test seams are introduced.
- **API seam: auth-manager's HTTP interface.** Add the cases to the existing client and domain integration specs. They use the typed request sender against a real Postgres, set up rows directly through drizzle, and check every response with `toSatisfyApiSpec()`. Cases for each resource:
  - unused: 204, and a later get or list no longer returns it;
  - nonexistent: 404;
  - in use by a connection in the same environment: 409, and the record is still there;
  - in use only by a connection in a different environment: 409;
  - in use only by an older connection version: 409;
  - in use only by a disabled connection: 409;
  - for domains, a connection listing several domains blocks each of them.
- **UI seam: rendered routes with the stubbed HTTP layer.** Add new specs for clients and domains next to the existing bundles and assets specs. They render the app's routes at the clients or domains path and stub requests with the shared HTTP stub. Cases:
  - each row has a Delete action that opens a confirmation naming the record;
  - cancelling sends nothing;
  - confirming sends the DELETE for that record;
  - a 204 removes the row after the list refetches and offers the send step when other sites exist;
  - a 409 shows the server's message and offers no send step;
  - sending to other sites calls each selected site and shows a result per site.
- Prior art: the existing client and domain integration specs in auth-manager. The bundles-list and create-asset specs in auth-ui.
- No unit tests for the managers. The integration tests cover their behaviour end to end.

## Out of Scope

- Cascading deletes (removing a client together with its connections) and deleting connections themselves.
- Soft delete, archival, or undo.
- Showing whether a record is in use before the user tries to delete it, or listing the blocking connections in the 409.
- Locking against concurrent connection saves.
- Offering the send-to-other-sites step when the local delete was refused, or any redesign of how changes reach other sites. Delete deliberately copies today's create and edit flow, and that flow is expected to be redesigned later.
- Foreign keys or other schema changes between connections and clients or domains.
- Bulk delete.

## Further Notes

- Bundles record connection names and versions only, so a client with no connection version cannot appear in any bundle. The "any version counts" rule is what keeps every recorded bundle pointing at clients and domains that still exist.
- The CORS configuration already allows `DELETE`, so no server configuration changes are needed.
- These are the first DELETE endpoints in auth-manager, so they set the pattern for any later delete operations.
