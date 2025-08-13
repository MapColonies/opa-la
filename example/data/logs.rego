package system.log

# Mask the 'token' field in the query parameters
mask contains "/input/query/token" 
# Mask the 'x-api-key' field in the headers parameters
mask contains "/input/headers/x-api-key"

drop if {
	input.result.allowed == true
}
