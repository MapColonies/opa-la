# METADATA
# title: HTTP Authorization Policy
# description: |
#   Evaluates incoming HTTP requests against JWT token validity, user configuration,
#   domain allowlists, origin allowlists, and user-agent requirements.
#   Produces a `decision` document indicating whether the request is allowed or denied.
# scope: package
# labels:
#   category: authz
#   layer: gateway
package http.authz

# METADATA
# title: Normalize Object Keys to Lowercase
# description: Returns a copy of an object with all keys lowercased, enabling case-insensitive header and input field lookups.
lower_object_keys(obj) := {k: v |
	some i
	v := obj[i]
	k := lower(i)
}

# METADATA
# title: JWT Verification Constraints
# description: RS256 algorithm and the active public key used to verify incoming JWTs.
constraints := {
	"cert": json.marshal({"keys": [data.keys]}),
	"alg": "RS256",
}

# METADATA
# title: Normalized Request Headers
# description: The incoming request headers with all keys lowercased for case-insensitive access.
headers := lower_object_keys(object.get(input, "headers", {}))

# METADATA
# title: Extracted Tokens
# description: |
#   Collects all tokens found at any of the configured possible locations (e.g. Authorization
#   header, query param). Each location is a two-element path [container, key] defined in
#   data.possibleLocations.
tokens := [token |
	some key in data.possibleLocations
	lower_obj := lower_object_keys(object.get(input, key[0], ""))
	token := object.get(lower_obj, key[1], null)
	token != null
]

# METADATA
# title: Default Claims (No Token)
# description: Fallback claims value used when no valid token is present; payload defaults to empty.
default claims := {"payload": {}}

# METADATA
# title: Decoded and Verified JWT Claims
# description: |
#   Decodes the first matching token found in the request, extracting the payload,
#   validity flag, and key ID (kid) from the JWT header.
claims := {"payload": payload, "valid": valid, "kid": kid} if {
	some token in tokens
	[header, payload, _] := io.jwt.decode(token)
	kid := object.get(header, "kid", null) # Extract kid from JWT header
	[valid, _, _] := io.jwt.decode_verify(token, constraints)
}

# METADATA
# title: C2B Service Account User Data
# description: |
#   Hardcoded profile for the c2b machine-to-machine service account.
#   Grants access only to the raster domain and bypasses origin and browser checks.
user_data := {"domains": ["raster"], "allowNoOrigin": true, "allowNoBrowser": true, "origins": []} if {
	claims.payload.sub == "c2b"
}

# METADATA
# title: User Data Lookup
# description: Retrieves the user configuration record from the data store by the token subject claim.
user_data := data.users[claims.payload.sub] if {
	claims.payload.sub != "c2b"
}

# METADATA
# title: Origin Validation Helper
# description: |
#   Returns true when the request origin does not match an allowed origin entry,
#   supporting both exact string match and glob patterns.
is_origin_invalid(origin_header, allowed_origin) if {
	allowed_origin != origin_header
	not glob.match(allowed_origin, [], origin_header)
}

# METADATA
# title: User-Agent Required (Non-Browser-Exempt Users)
# description: True when the user's profile does not grant browser exemption, requiring a User-Agent header.
need_user_agent if {
	not user_data.allowNoBrowser
}

# METADATA
# title: User-Agent Required (C2B)
# description: The c2b service account always requires a User-Agent to enforce the QGIS/ARCGIS check.
need_user_agent if {
	claims.payload.sub == "c2b"
}

# METADATA
# title: Warn — Token Environment Mismatch
# description: |
#   Warns when the kid in the token does not match the expected key ID for this environment,
#   preventing cross-environment token reuse.
warn contains "token environment mismatch" if {
	claims.kid != data.keys.kid
}

# METADATA
# title: Deny — No Token Found
# description: Denies the request when no token is present in any of the configured possible locations.
# labels:
#   group: token-missing
#   category: authentication
#   type: missing
deny contains "no token supplied in any of the possible locations" if {
	count(tokens) == 0
}

# METADATA
# title: Deny — Token Not Valid
# description: Denies when a token was found but fails cryptographic verification (expired, bad signature, wrong issuer, etc.).
# labels:
#   group: token-invalid
#   category: authentication
#   type: invalid
deny contains "token not valid" if {
	not claims.valid
	count(tokens) > 0
}

# METADATA
# title: Deny — User Not Found
# description: |
#   Denies when the token is cryptographically valid but the subject (sub) has no
#   corresponding user record in the data store.
# labels:
#   group: user-missing
#   category: authorization
#   type: missing
deny contains "the token is valid, but the user is not found" if {
	claims.valid
	not user_data
}

# METADATA
# title: Deny — Domain Missing
# description: Denies when the request does not include a domain field, which is required for domain allowlist evaluation.
# labels:
#   group: domain-missing
#   category: authorization
#   type: missing
deny contains "domain missing" if {
	not input.domain
}

# METADATA
# title: Deny — Domain Not Allowed
# description: Denies when the requested domain is not present in the user's allowed domains list.
# labels:
#   group: domain-unauthorized
#   category: authorization
#   type: unauthorized
deny contains "domain check failed" if {
	every domain in user_data.domains { domain != input.domain }
}

# METADATA
# title: Deny — Origin Not Allowed
# description: |
#   Denies when the request origin does not match any entry in the user's allowed origins list,
#   the user requires an origin (allowNoOrigin is false), the subject is not c2b,
#   and the request is not same-origin (sec-fetch-site != same-origin).
# labels:
#   group: origin-unauthorized
#   category: authorization
#   type: unauthorized
deny contains "origin check failed" if {
	origin_header := object.get(headers, "origin", "A")
	every origin in user_data.origins { is_origin_invalid(origin_header, origin) }

	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"

	object.get(headers, "sec-fetch-site", "avi") != "same-origin"
}

# METADATA
# title: Deny — User-Agent Missing
# description: Denies when no User-Agent header is present and a User-Agent is required for the caller.
# labels:
#   group: user-agent-missing
#   category: browser-validation
#   type: missing
deny contains "user-agent missing" if {
	not headers["user-agent"]
	need_user_agent
}

# METADATA
# title: Deny — User-Agent Not From Allowed Browser
# description: |
#   Denies when the User-Agent does not match any known browser engine token
#   (Gecko, AppleWebKit, Opera, Trident, Edge, Chrome).
# labels:
#   group: user-agent-unauthorized
#   category: browser-validation
#   type: unauthorized
deny contains "user-agent is not from allowed browsers" if {
	not user_data.allowNoBrowser
	not regex.match(`.*(Gecko|AppleWebKit|Opera|Trident|Edge|Chrome)\/\d.*$`, headers["user-agent"])
}

# METADATA
# title: Deny — C2B Client Not QGIS or ARCGIS
# description: Denies c2b service account requests that do not originate from a QGIS or ARCGIS user agent.
# labels:
#   group: user-agent-unauthorized
#   category: browser-validation
#   type: unauthorized
deny contains "c2b user only allowed from QGIS or ARCGIS" if {
	claims.payload.sub == "c2b"

	user_agent := lower(headers["user-agent"])

	not contains(user_agent, "qgis")
	not contains(user_agent, "arcgis")
}

metadata := {
	"sub": object.get(claims.payload, "sub", "N/A"),
	"kid": object.get(claims, "kid", "N/A"),
}

warnings := concat(", ", warn) if {
	count(warn) > 0
}

default decision := {"allowed": false, "reason": "unknown error"}

# METADATA
# title: Authorization Decision
# description: |
#   Policy entrypoint. Produces allowed:true with the subject and kid when all checks pass,
#   or allowed:false with a concatenated reason string when any deny rule fires.
# entrypoint: true
decision := {"allowed": true, "metadata": metadata, "warnings": warnings} if {
	count(deny) == 0
	claims.payload.sub != null
}

decision := {"allowed": false, "metadata": metadata, "reason": reason, "warnings": warn} if {
	count(deny) > 0
	reason := concat(", ", deny)
}
