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

import future.keywords.not

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
# title: Chromium Brand Tokens
# description: Known Sec-CH-UA brand values sent by genuine Chromium-based browsers.
chromium_ch_ua_brands := ["Chromium", "Google Chrome", "Microsoft Edge", "Brave"]

# METADATA
# title: Known Bot Patterns
# description: Substring patterns used to identify known automation tools in the User-Agent header.
bot_patterns := ["curl", "python", "wget", "java/", "go-http-client", "okhttp", "axios", "libwww"]

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

	# Use "." as delimiter so "*" only matches a single domain label.
	# e.g. "*.example.com" matches "sub.example.com" but NOT "a.b.example.com".
	not glob.match(allowed_origin, ["."], origin_header)
}

extract_host(url) := host if {
	without_scheme := regex.replace(url, `^https?://`, "")
	host := split(without_scheme, "/")[0]

	# Guard: only process URLs that actually started with http(s)://
	regex.match(`^https?://`, url)
}

extract_host(url) := "__invalid__" if {
	url != ""
	not startswith(url, "http://")
	not startswith(url, "https://")
}

# METADATA
# title: IE11 Detection Helper
# description: True when the User-Agent contains the IE11 Trident/7.0 engine token.
is_ie11 if {
	regex.match(`Trident/7\.0`, headers["user-agent"])
}

## METADATA
# title: Image Fetch Detection Helper
# description: True when Sec-Fetch-Dest indicates an image or paintworklet subresource request.

# is_image_fetch if {
# 	lower(object.get(headers, "sec-fetch-dest", "")) in {"image", "paintworklet"}
# }

## METADATA
# title: API Fetch Detection Helper
# description: True when Sec-Fetch-Dest is empty or absent, indicating an XHR/fetch API request.

# is_api_fetch if {
# 	dest := lower(object.get(headers, "sec-fetch-dest", ""))
# 	dest in {"empty", ""}
# 	not is_image_fetch
# 	not is_ie11
# }

# METADATA
# title: Referer Origin Invalid Helper
# description: |
#   True when the Referer header is present but its bare host does not match any of the
#   user's allowed origins. Shared by the IE11, image, and API fallback deny rules.
is_referer_origin_invalid if {
	user_data
	referer_header := object.get(headers, "referer", "")
	referer_header != ""
	ref_host := extract_host(referer_header)
	every o in user_data.origins { is_origin_invalid(ref_host, o) }
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
# title: Warn — IE11 Legacy Browser Detected
# description: |
#   Logs a warning when an IE11 request passes the origin/referer check, signalling
#   that a legacy browser is in use. The request is allowed to proceed.
warn contains "ie11 legacy browser detected" if {
	user_data
	is_ie11
	claims.payload.sub != "c2b"

	# OPA evaluates deny and warn as independent sets — no circular dependency.
	not deny[{"reason": "ie11 missing origin and referer", "code": "ie11_missing_origin_and_referer"}]
	not deny[{"reason": "ie11 origin and referer check failed", "code": "ie11_origin_and_referer_check_failed"}]
}

# METADATA
# title: Deny — No Token Found
# description: Denies the request when no token is present in any of the configured possible locations.
# labels:
#   group: token-missing
#   category: authentication
#   type: missing
deny contains {"reason": "no token supplied in any of the possible locations", "code": "no_token_supplied"} if {
	count(tokens) == 0
}

# METADATA
# title: Deny — Token Not Valid
# description: Denies when a token was found but fails cryptographic verification (expired, bad signature, wrong issuer, etc.).
# labels:
#   group: token-invalid
#   category: authentication
#   type: invalid
deny contains {"reason": "token not valid", "code": "token_not_valid"} if {
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
deny contains {"reason": "the token is valid, but the user is not found", "code": "user_not_found"} if {
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
deny contains {"reason": "domain missing", "code": "domain_missing"} if {
	not input.domain
}

# METADATA
# title: Deny — Domain Not Allowed
# description: Denies when the requested domain is not present in the user's allowed domains list.
# labels:
#   group: domain-unauthorized
#   category: authorization
#   type: unauthorized
deny contains {"reason": $"domain check failed: '{input.domain}' is not in the allowed domains {concat(", ", user_data.domains)}", "code": "domain_check_failed"} if {
	every domain in user_data.domains { domain != input.domain }
}

# METADATA
# title: Deny — User-Agent Missing
# description: Denies when no User-Agent header is present and a User-Agent is required for the caller.
# labels:
#   group: user-agent-missing
#   category: browser-validation
#   type: missing
deny contains {"reason": "user-agent missing", "code": "user_agent_missing"} if {
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
deny contains {"reason": $`user-agent is not from allowed browsers: '{headers["user-agent"]}'`, "code": "user_agent_not_allowed"} if {
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
deny contains {"reason": $"c2b user only allowed from QGIS or ARCGIS, got: '{user_agent}'", "code": "c2b_ua_not_allowed"} if {
	claims.payload.sub == "c2b"

	user_agent := lower(headers["user-agent"])

	not contains(user_agent, "qgis")
	not contains(user_agent, "arcgis")
}

# METADATA
# title: Deny — Bot User-Agent Detected
# description: |
#   Denies requests whose User-Agent matches a known automation tool pattern.
#   The matched pattern is included in the deny reason for operator visibility.
# labels:
#   group: user-agent-bot
#   category: browser-validation
#   type: unauthorized
deny contains {"reason": $"bot user-agent detected: {pattern}", "code": "bot_user_agent_detected"} if {
	user_data
	not user_data.allowNoBrowser
	some pattern in bot_patterns
	contains(lower(headers["user-agent"]), pattern)
}

## METADATA
# title: Deny — Sec-Fetch-Dest Image Request Does Not Accept Image Content
# description: |
#   Denies requests that declare an image destination (Sec-Fetch-Dest: image/paintworklet)
#   but do not accept image MIME types in the Accept header. This inconsistency indicates
#   non-browser automation spoofing an image fetch.
# labels:
#   group: mime-mismatch
#   category: browser-validation
#   type: unauthorized

# deny contains "sec-fetch-dest image request does not accept image content" if {
# 	user_data
# 	not user_data.allowNoBrowser
# 	sec_fetch_dest := lower(object.get(headers, "sec-fetch-dest", ""))
# 	sec_fetch_dest in {"image", "paintworklet"}
# 	accept := object.get(headers, "accept", "")
# 	not contains(accept, "image/")
# }

## METADATA
# title: Deny — Chromium Browser Missing Sec-Fetch Headers
# description: |
#   Denies Chromium-based requests that lack Sec-Fetch-Site. Genuine browser requests
#   from Chromium always include Sec-Fetch headers; absence implies UA spoofing.
# labels:
#   group: user-agent-metadata
#   category: browser-validation
#   type: unauthorized

# deny contains "chromium browser missing sec-fetch headers" if {
# 	user_data
# 	not user_data.allowNoBrowser
# 	regex.match(`Chrome/\d`, headers["user-agent"])
# 	not headers["sec-fetch-site"]
# }

## METADATA
# title: Deny — Sec-CH-UA Header Contradicts User-Agent
# description: |
#   Denies when Sec-CH-UA is present and the UA claims Chromium but no known Chromium
#   brand token appears in Sec-CH-UA, indicating a forged or mismatched header pair.
# labels:
#   group: user-agent-metadata
#   category: browser-validation
#   type: unauthorized

# deny contains "sec-ch-ua header contradicts user-agent" if {
# 	user_data
# 	not user_data.allowNoBrowser
# 	regex.match(`Chrome/\d`, headers["user-agent"])
# 	sec_ch_ua := object.get(headers, "sec-ch-ua", "")
# 	sec_ch_ua != ""
# 	every brand in chromium_ch_ua_brands {
# 		not contains(sec_ch_ua, brand)
# 	}
# }

## METADATA
# title: Warn — Safari or Firefox UA with Sec-CH-UA (Chromium-Only Header)
# description: |
#   Logs a soft warning when a Safari or Firefox UA includes Sec-CH-UA, which is a
#   Chromium-only header. This is a potential spoofing signal; the request is allowed.

# warn contains "safari or firefox ua with sec-ch-ua header (chromium-only header)" if {
# 	user_data
# 	sec_ch_ua := object.get(headers, "sec-ch-ua", "")
# 	sec_ch_ua != ""
# 	ua := lower(object.get(headers, "user-agent", ""))
# 	regex.match(`(safari|firefox)\/\d`, ua)
# 	not regex.match(`chrome\/\d`, ua) # exclude Chrome-on-Safari-engine (e.g. iOS Chrome)
# }

## METADATA
# title: Deny — No Origins Configured for User
# description: |
#   Denies when the user requires origin validation (allowNoOrigin is false) but has
#   no entries in their origins list. This is a misconfiguration: without any allowed
#   origins the user can never be granted access, so deny early with a clear reason.
# labels:
#   group: origin-misconfigured
#   category: authorization
#   type: misconfigured

deny contains {"reason": "user has no allowed origins configured", "code": "no_origins_configured"} if {
	user_data
	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"
	count(user_data.origins) == 0
}

# METADATA
# title: Deny — IE11 Missing Origin and Referer
# description: Denies IE11 requests where neither Origin nor Referer header is present (no identity).
# labels:
#   group: origin-missing
#   category: authorization
#   type: missing
deny contains {"reason": "ie11 missing origin and referer", "code": "ie11_missing_origin_and_referer"} if {
	user_data
	is_ie11
	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"
	not headers.origin
	not headers.referer
}

## METADATA
# title: Deny — IE11 Origin and Referer Check Failed
# description: |
#   Denies IE11 requests where at least one identity header was present but none matched
#   an allowed domain.
# labels:
#   group: origin-unauthorized
#   category: authorization
#   type: unauthorized

# deny contains "ie11 origin and referer check failed" if {
# 	is_ie11
# 	not user_data.allowNoOrigin
# 	claims.payload.sub != "c2b"

# 	# At least one header was present (the fully-absent case is handled above).
# 	some _ in [object.get(headers, "origin", null), object.get(headers, "referer", null)]

# 	# Strip scheme from origin before comparing against domain-only entries in user data.
# 	# extract_host("__missing__") returns "__invalid__" so absent origin is always invalid.
# 	origin_host := extract_host(object.get(headers, "origin", "__missing__"))
# 	every o in user_data.origins { is_origin_invalid(origin_host, o) }

# 	is_referer_origin_invalid
# }

## METADATA
# title: Warn — Image Request Missing Referer
# description: Image subresource request arrived without a Referer header; identity is unknown.

# warn contains "image request missing referer" if {
# 	user_data
# 	is_image_fetch
# 	not user_data.allowNoOrigin
# 	claims.payload.sub != "c2b"
# 	object.get(headers, "sec-fetch-site", "") != "same-origin"
# 	not headers["referer"]
# 	# Only warn when the deny rule is not also firing.
# 	not deny["image request referer check failed"]
# }

## METADATA
# title: Deny — Image Request Referer Check Failed
# description: Denies image subresource requests whose Referer origin does not match an allowed domain.
# labels:
#   group: origin-unauthorized
#   category: authorization
#   type: unauthorized

# deny contains "image request referer check failed" if {
# 	is_image_fetch
# 	not user_data.allowNoOrigin
# 	claims.payload.sub != "c2b"
# 	object.get(headers, "sec-fetch-site", "") != "same-origin"
# 	is_referer_origin_invalid
# }

# METADATA
# title: Deny — API Request Missing Origin and Referer
# description: |
#   Denies API/XHR requests where no identity header (Origin or Referer) was sent at all.
# labels:
#   group: origin-missing
#   category: authorization
#   type: missing
deny contains {"reason": "api request missing origin and referer", "code": "api_missing_origin_and_referer"} if {
	user_data

	# is_api_fetch
	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"

	# object.get(headers, "sec-fetch-site", "") != "same-origin"
	not headers.origin
	not headers.referer
}

# METADATA
# title: Deny — API Request Origin Mismatch
# description: |
#   Denies API/XHR requests where Origin is present but does not match any allowed domain.
# labels:
#   group: origin-unauthorized
#   category: authorization
#   type: unauthorized
deny contains {"reason": $"api request origin mismatch: '{origin_host}' is not in the allowed origins {user_data.origins}", "code": "api_origin_mismatch"} if {
	# is_api_fetch
	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"

	# object.get(headers, "sec-fetch-site", "") != "same-origin"
	# Strip scheme: Origin header sends "https://host" but data stores host-only.
	origin_raw := object.get(headers, "origin", "")
	origin_raw != ""
	origin_host := extract_host(origin_raw)
	every o in user_data.origins { is_origin_invalid(origin_host, o) }
}

# METADATA
# title: Deny — API Request Referer Fallback Check Failed
# description: |
#   Denies API/XHR requests where Origin is absent and the Referer fallback origin does
#   not match any allowed domain.
# labels:
#   group: origin-unauthorized
#   category: authorization
#   type: unauthorized
deny contains {"reason": "api request referer fallback check failed", "code": "api_request_referer_check_failed"} if {
	# is_api_fetch
	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"
	object.get(headers, "sec-fetch-site", "") != "same-origin"
	not headers.origin
	is_referer_origin_invalid
}

metadata := {
	"sub": object.get(claims.payload, "sub", "N/A"),
	"kid": object.get(claims, "kid", "N/A"),
}

default warnings := []

warnings := warn if {
	count(warn) > 0
}

default computed_status := "allowed"

computed_status := "warning" if {
	count(warn) > 0
}

default decision := {"allowed": false, "reasons": ["unknown error"], "codes": ["unknown_error"], "computed_status": "denied"}

# METADATA
# title: Authorization Decision
# description: |
#   Policy entrypoint. Produces allowed:true with the subject and kid when all checks pass,
#   or allowed:false with a concatenated reason string when any deny rule fires.
# entrypoint: true
decision := {"allowed": true, "metadata": metadata, "warnings": warnings, "computed_status": computed_status} if {
	count(deny) == 0
	claims.payload.sub != null
}

decision := {"allowed": false, "metadata": metadata, "reasons": reasons, "codes": codes, "warnings": warnings, "computed_status": computed_status} if {
	count(deny) > 0
	reasons := [d.reason | some d in deny]
	codes := [d.code | some d in deny]
	computed_status := "denied"
}
