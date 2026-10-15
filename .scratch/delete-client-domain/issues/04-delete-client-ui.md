# 04 — Delete a client from the UI, including other sites

**What to build:** On the Clients page, every row has a Delete action next to Edit. It
opens the same two-step delete modal built in ticket 03. The confirm step deletes on
the current site and shows the server's message on `409`/`404`. After a local success,
the send step can send the same delete to other sites and shows results per site.

Spec: `.scratch/delete-client-domain/spec.md`. Delivered in the UI PR
(`feat/delete-client-domain-ui`), alongside ticket 03.

**Blocked by:** 02 — Delete an unused client through the API; 03 — Delete a domain from the UI, including other sites (reuses its modal)

**Status:** ready-for-agent

- [ ] The clients table's actions column has a Delete button next to Edit on every row
- [ ] Delete opens a confirmation that names the client. Cancelling sends no request
- [ ] Confirming sends `DELETE /client/{clientName}` for that row to the current site
- [ ] On `204`, the row disappears after the list refreshes, and the send-to-other-sites step is offered when other sites exist
- [ ] On `409` (or `404`), the server's message is shown in the modal, and the send step is not offered
- [ ] Sending to other sites calls each selected site and shows a success or error result per site
- [ ] Covered by new route-level UI specs using the shared HTTP stub
