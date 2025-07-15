package http.authz

import future.keywords.contains
import future.keywords.every
import future.keywords.if

lower_object_keys(obj) := newObj if {
	newObj := {k: v |
		some i
		v := obj[i]
		k := lower(i)
	}
}

constraints := {
	"cert": json.marshal({"keys": [data.keys]}),
	"alg": "RS256",
}

headers := lower_object_keys(input.headers)

tokens := [token |
	keys := data.possibleLocations[_]
	lowerObj := lower_object_keys(object.get(input, keys[0], ""))
	temp := object.get(lowerObj, keys[1], null)
	temp != null
	token := temp
]

claims := {"payload": payload, "valid": valid, "kid": kid} if {
	token := tokens[_]
	[valid, header, payload] := io.jwt.decode_verify(token, constraints)
	kid := object.get(header, "kid", null) # Extract kid from JWT header
}

userData := data.users[claims.payload.sub]

deny contains "no token supplied" if {
	count(tokens) == 0
}

deny contains "token not valid" if {
	not claims.valid
	count(tokens) > 0
}

deny contains "user details missing" if {
	not userData
}

deny contains "domain missing" if {
	not input.domain
}

deny contains "domain check failed" if {
	every domain in userData.domains { domain != input.domain }
}

allowed_empty_origin if {
	originHeader := object.get(headers, "origin", "A")
	originHeader = "A"
	userData.allowNoOrigin
}

bad_browser_request if {
	not userData.allowNoBrowser
	regex.match(".*(Gecko|AppleWebKit|Opera|Trident|Edge|Chrome)\\/\\d.*$", headers["user-agent"])
}

is_origin_invalid(originHeader, allowedOrigin) if {
	allowedOrigin != originHeader
	not glob.match(allowedOrigin, [], originHeader)
}


deny contains "origin check failed" if {
	originHeader := object.get(headers, "origin", "A")
	every origin in userData.origins { is_origin_invalid(originHeader, origin) }

	not allowed_empty_origin

	object.get(headers, "Sec-Fetch-Site", "avi") != "same-origin"

	bad_browser_request
}

decision := {"allowed": true, "sub": claims.payload.sub, "kid": claims.kid} if {
	count(deny) == 0
	claims.payload.sub != null
}

decision := {"allowed": false, "reason": reason} if {
	count(deny) > 0
	reason := concat(", ", deny)
}
