package http.authz

lower_object_keys(obj) := {k: v |
	some i
	v := obj[i]
	k := lower(i)
}

constraints := {
	"cert": json.marshal({"keys": [data.keys]}),
	"alg": "RS256",
}

headers := lower_object_keys(input.headers)

tokens := [token |
	# keys := data.possibleLocations[_]
	some key in data.possibleLocations
	lower_obj := lower_object_keys(object.get(input, key[0], ""))
	token := object.get(lower_obj, key[1], null)
	token != null
]

claims := {"payload": payload, "valid": valid, "kid": kid} if {
	# token := tokens[_]
	some token in tokens
	[header, payload, _] := io.jwt.decode(token)
	kid := object.get(header, "kid", null) # Extract kid from JWT header
	[valid, _, _] := io.jwt.decode_verify(token, constraints)
}

user_data := {"domains": ["raster"], "allowNoOrigin": true, "allowNoBrowser": true, "origins": []} if {
	claims.payload.sub == "c2b"
}

user_data := data.users[claims.payload.sub] if {
	claims.payload.sub != "c2b"
}

is_origin_invalid(origin_header, allowed_origin) if {
	allowed_origin != origin_header
	not glob.match(allowed_origin, [], origin_header)
}

need_user_agent if {
	not user_data.allowNoBrowser
}

need_user_agent if {
	claims.payload.sub == "c2b"
}

deny contains "no token supplied in any of the possible locations" if {
	count(tokens) == 0
}

deny contains "token environment mismatch" if {
	claims.kid != data.keys.kid
}

deny contains "token not valid" if {
	not claims.valid
	count(tokens) > 0
}

deny contains "the token is valid, but the user is not found" if {
	claims.valid
	not user_data
}

deny contains "domain missing" if {
	not input.domain
}

deny contains "domain check failed" if {
	every domain in user_data.domains { domain != input.domain }
}

deny contains "origin check failed" if {
	origin_header := object.get(headers, "origin", "A")
	every origin in user_data.origins { is_origin_invalid(origin_header, origin) }

	not user_data.allowNoOrigin
	claims.payload.sub != "c2b"

	object.get(headers, "sec-fetch-site", "avi") != "same-origin"
}

deny contains "user-agent missing" if {
	not headers["user-agent"]
	need_user_agent
}

deny contains "user-agent is not from allowed browsers" if {
	not user_data.allowNoBrowser
	not regex.match(`.*(Gecko|AppleWebKit|Opera|Trident|Edge|Chrome)\/\d.*$`, headers["user-agent"])
}

deny contains "c2b user only allowed from QGIS or ARCGIS" if {
	claims.payload.sub == "c2b"

	user_agent := lower(headers["user-agent"])

	not contains(user_agent, "qgis")
	not contains(user_agent, "arcgis")
}

# METADATA
# entrypoint: true
decision := {"allowed": true, "sub": claims.payload.sub, "kid": claims.kid} if {
	count(deny) == 0
	claims.payload.sub != null
}

decision := {"allowed": false, "reason": reason} if {
	count(deny) > 0
	reason := concat(", ", deny)
}
