package http.authz

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

default claims = {"payload": {}}

claims := {"payload": payload, "valid": valid, "kid": kid} if {
	token := tokens[_]
	[header, payload, _] := io.jwt.decode(token)
	kid := object.get(header, "kid", null) # Extract kid from JWT header
    [valid, _, _] := io.jwt.decode_verify(token, constraints)
}

userData := {"domains": ["raster"], "allowNoOrigin": true, "allowNoBrowser": true, "origins": []} if {
    claims.payload.sub == "c2b"
}

userData := data.users[claims.payload.sub] if {
    claims.payload.sub != "c2b"
}

deny contains {"reason":"no token supplied in any of the possible locations", "code": "TOKEN_MISSING"} if {
	count(tokens) == 0
}

# deny contains {"reason":"token environment mismatch", "code": "TOKEN_MISMATCH"} if {
#     claims.kid != data.keys.kid
# }

deny contains {"reason":"token not valid", "code": "TOKEN_INVALID"} if {
	not claims.valid
	count(tokens) > 0
}

deny contains {"reason":"the token is valid, but the user is not found", "code": "USER_NOT_FOUND"} if {
    claims.valid
	not userData
}

deny contains {"reason":"domain missing", "code": "DOMAIN_MISSING"} if {
	not input.domain
}

deny contains {"reason":"domain not allowed for this user", "code": "DOMAIN_INCORRECT"} if {
	every domain in userData.domains { domain != input.domain }
}

is_origin_invalid(originHeader, allowedOrigin) if {
	allowedOrigin != originHeader
	not glob.match(allowedOrigin, [], originHeader)
}


deny contains {"reason":"origin check failed", "code": "ORIGIN_CHECK_FAILED"} if {
	originHeader := object.get(headers, "origin", "A")
	every origin in userData.origins { is_origin_invalid(originHeader, origin) }

	not userData.allowNoOrigin
    claims.payload.sub != "c2b"

	object.get(headers, "sec-fetch-site", "avi") != "same-origin"
}

need_user_agent := true if {
    not userData.allowNoBrowser
}

need_user_agent := true if {
    claims.payload.sub == "c2b"
}


deny contains {"reason":"user-agent missing", "code": "USER_AGENT_MISSING"} if {
    not headers["user-agent"]
    need_user_agent
}

deny contains {"reason":"user-agent is not from allowed browsers", "code": "USER_AGENT_NOT_ALLOWED"} if {
    not userData.allowNoBrowser
	not regex.match(".*(Gecko|AppleWebKit|Opera|Trident|Edge|Chrome)\\/\\d.*$", headers["user-agent"])
}

deny contains {"reason":"c2b user only allowed from QGIS or ARCGIS", "code": "C2B_USER_AGENT_NOT_ALLOWED"} if {
	userAgent := lower(headers["user-agent"])

	claims.payload.sub == "c2b"
	not contains(userAgent, "qgis")
	not contains(userAgent, "arcgis")
}

decision := {"allowed": true, "sub": claims.payload.sub, "kid": claims.kid} if {
	count(deny) == 0
	claims.payload.sub != null
}

decision := {"allowed": false, "reason": reason, "sub": sub, "codes": codes} if {
	count(deny) > 0

	reasons := [d.reason | some d in deny]
	codes := [d.code | some d in deny]

	reason := concat(", ", reasons)
	sub := object.get(claims.payload, "sub", "N/A")
}
