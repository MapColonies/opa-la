package system.log

# Mask the 'token' field in the query parameters
mask contains {"op":"upsert","path":"/input/query/token", "value": "**redacted**"} if {
    input.input.query.token
}
# Mask the 'x-api-key' field in the headers parameters
mask contains {"op":"upsert","path":"/input/headers/x-api-key", "value": "**redacted**"} if {
    input.input.headers["x-api-key"]
}

drop if {
	input.result.allowed == true
}
