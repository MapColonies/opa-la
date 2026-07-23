package system.log

allowed_request if {
	input.result.allowed == true
	input.result.warnings == []
}

# Mask the 'token' field in the query parameters
mask contains {"op": "upsert", "path": "/input/query/token", "value": "**redacted**"} if {
	input.input.query.token
	not allowed_request
}

# Mask the 'x-api-key' field in the headers parameters
mask contains {"op": "upsert", "path": "/input/headers/x-api-key", "value": "**redacted**"} if {
	input.input.headers["x-api-key"]
	not allowed_request
}

mask contains {"op": "upsert", "path": "/input", "value": r} if {
	allowed_request

	r := {"domain": input.input.domain}
}
