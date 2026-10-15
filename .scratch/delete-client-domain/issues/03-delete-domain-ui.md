# 03 — Delete a domain from the UI, including other sites

**What to build:** On the Domains page, every row has a Delete action. It opens a
two-step delete modal that mirrors the existing create modals:

1. **Confirm:** the modal names the domain and warns that the delete is permanent.
   Confirming sends the DELETE to the current site, with the button disabled while it
   runs. A `409` or `404` shows the server's message as a destructive alert inside the
   modal, and the modal stays on this step. A `204` shows a success alert and
   refreshes the domains list.
2. **Send to other sites:** reached only after a local success, and only when other
   sites exist. The operator picks sites with the existing site selection component.
   The same DELETE runs against each chosen site in parallel. A result is shown per
   site, plus success and failure toasts, the same as create.

The UI never checks ahead whether a domain is in use; the API's `409` is the only source
of truth. Build the modal so ticket 04 can reuse it for clients.

Spec: `.scratch/delete-client-domain/spec.md`. Delivered in the UI PR
(`feat/delete-client-domain-ui`, stacked on the API PR).

**Blocked by:** 01 — Delete an unused domain through the API

**Status:** ready-for-agent

- [ ] The domains table has an actions column with a Delete button on every row
- [ ] Delete opens a confirmation that names the domain. Cancelling sends no request
- [ ] Confirming sends `DELETE /domain/{domainName}` for that row to the current site
- [ ] On `204`, the row disappears after the list refreshes, and the send-to-other-sites step is offered when other sites exist
- [ ] On `409` (or `404`), the server's message is shown in the modal, and the send step is not offered
- [ ] Sending to other sites calls each selected site and shows a success or error result per site
- [ ] Covered by new route-level UI specs using the shared HTTP stub, following the bundles and assets specs
