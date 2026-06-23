package http.authz_test

import data.http.authz

private_key_1 := {
	"kty": "RSA",
	"n": "sblCdtKBNbpuVmLWs5N6sIS3TJdccFno3XdRDg_CbZtNgLb9ZGk2YxPlXqdwFW7mv3R_W7zrhezk_XOa8n4Phm3PUmyrg6ha7dUwS7ZvzK8dxHyDOBySWRrS0Py_7iFyDxE8Oeb1gRQ84NsnhH41ln3jcS35nrqj0IeSpFzG9ZUErvhTjIU3x-rUNIYLDeOQp39wY-Y39S6tZ8BGecPtShBOnWoSgPFVLcMvK1WFW7xRdYP-kcof2xjBIejAYDOr-utazDclVh5Zl5fzeiUWo7HQkbvX-g-DMth1tfPGeyzQJhX6HAyr9mPfI-c0iE2gnxH4dWmsEWpolw3Ru-jeSQ",
	"e": "AQAB",
	"d": "O6pIh_-v5UvLkzDnh64xeGV17D68h_OHXCKcka30xjtnT5kfhMBVw_l__cEUvf1Xdls0DqZkI7geQIC5OkPcDnN7MN7OzgqNTF9QMXr0GbGIuthabVIaR9PbhtHz1Yxg8HIG2CGTtlwG_C5XHAILF5T38J1QultKd82sC4YiPXvUlVFlfZF7BezQxPEYRc_uveRTdQznKBR82Q1vkjM6xelwBMOD_Xq_0ef3ql6-nPrwCnUck7kzliDwe9qqHkmlKhPBuBWIQuB9IGOrxQCJZYRtCJbspTxPRTaoyBV_czp-az7xWCzai_DEJullqdzhFD6KA8X-dZf8XTjjbEfp6Q",
	"p": "3tIP-3k443tS_qvS5kdTpaKxJoD182fJdWlbTjuFSLKgMzRVdr8PiaSOG3RD4dzfufjAfP3AFko4nQnC59kuPdRbNJwD7MNzAuvkquUkRq7OB0g_Fj5pC3PcKaRU57mpsCc6thdIXsOKzvCZgXM8IxncxI1G0Su-Um8bHgr8M58",
	"q": "zDAZqxf8zoX69XbOZxYZRywk3OTpkD18_ZEK4cSZkrrOij79SFIU1e4oYFFrCGxj2hhKgp2hGE3TqSty9wYssbVdNlERICJPX4DZj9Qt5_ijb8bG2_r7VG1CjRn-qEtSSLjdrdEsbdx_qBFzNH-wHXguQ93loJvsJqoEJboN5Rc",
	"dp": "X2e4OiecaSKb1bmCcuEleq1fhqn_JXpR8zjqRGQN3KPHHkWRNmf2YiwYQL8WdbYaAUn2OU55GdIrzWmpj5YZS5YKe0s2DwFc1GpmnZnBX5ZnVwzjHkYYujOgmB_pztJbSrZxWBg9_31giNzSDXBm1myzb2FCajt9oVQ7WzC-7ec",
	"dq": "Ohf9VZZvkPrBmhEBTIcXDg7bNhXS9fzokOQxamabIwoPNXoSaf8genVV-4FuqGjeR_DdUigy601JSTpZbTrOgIkPSiLqcnAQkSWBwNAnd3ZgWa7-aRwRYcXsR2T79Tno4VPnjkqTD3bKwzCjzG3_14KX9yss5_M0zxNUNr-msGU",
	"qi": "aX33ijcsC0itjrEuYzv9F6yiLHvToDu6eF5JdZkNIzCeAX9_jIN8G75d4j4G0xPjwCRRnT3RgXExNLJArNSv73zhxWvA6eQc_LL4wyaVjWU9UDg1yec6NmEow2QEHGr5W1vlu5bRk7QZYEKmhjLO3f4icIkyEoprHYt-tMZ2qtE",
	"alg": "RS256",
	"kid": "opa_test_key_1",
}

public_key_1 := {
	"kty": "RSA",
	"n": "sblCdtKBNbpuVmLWs5N6sIS3TJdccFno3XdRDg_CbZtNgLb9ZGk2YxPlXqdwFW7mv3R_W7zrhezk_XOa8n4Phm3PUmyrg6ha7dUwS7ZvzK8dxHyDOBySWRrS0Py_7iFyDxE8Oeb1gRQ84NsnhH41ln3jcS35nrqj0IeSpFzG9ZUErvhTjIU3x-rUNIYLDeOQp39wY-Y39S6tZ8BGecPtShBOnWoSgPFVLcMvK1WFW7xRdYP-kcof2xjBIejAYDOr-utazDclVh5Zl5fzeiUWo7HQkbvX-g-DMth1tfPGeyzQJhX6HAyr9mPfI-c0iE2gnxH4dWmsEWpolw3Ru-jeSQ",
	"e": "AQAB",
	"alg": "RS256",
	"kid": "opa_test_key_1",
}

private_key_2 := {
	"kty": "RSA",
	"n": "7yGzPxFIxM2sxWojt-jYlVyoO_oeFya647mFMq_5ZEhrJypu0iN5I2iDdjEx6k7osXk5-qNgfLvhx8OPUGC043WKiPRQicjgRcR47NNavY2eTmFOwe_a5ey0fCmAzLeA3FHNAmzOBlZ4U6taJCpAR5_vaPwkF-mcaOCm9eEO4NkKjFV05yVG6wh9GcCunMmMe6Bs6RHPmVVtl3xfbYBpYci6sIOZIsJujXCklwh6XvVQDD0hJUyTX-GPywAxU9nUDaBbQvQoljOf-2TE3G_Mw0V1MkZLzlXsy8-jBa7eZ6XI9MjD-CnlOI9t7qWmKGRcgX5VsAZmyYJQ995YUoaq9Q",
	"e": "AQAB",
	"d": "eCXWibmFdlxgkk_h4mV7bJBBduEUfU1YWVK9Odpw05IPRH5tb-ei1ceNRbUx_yfmgkUGfIfZ0tITfusi9p-gQyirkmQukwv6oxM0LsmCrfqZr4f0qjx5H0zu4fN4Y2NPu2LePnmsikKn8mIFyGXyJgqVn4oQGHOnwoodWSza7N0nWnQlLGE3FTVNq4-tHvzrf4P4BXAMvzAeDXUkoCAv9-1i-7DomZM94y1r2w-64pF1m9XbUgJqT3v6uZqN-JJHOkpoNX5qcLnLIOHL_MFS8Fqw-wVowovLAI57yzchZT0x_0WmuW1KbuV9RWqL2NtuP5LLklcSO6P7s53G26UYAQ",
	"p": "_axgheGEleyetH8ONoBTjJb8ngoZo-zGmRySi6k-_r8cnf4krfAgeTT86rvuCNEBFaBIB0QxZfNYiD3u72FkAqSoMvfU7z9cM4K2vq-g171CkNibrWas3GbD8y9o6l6kJF_73GcjQbX8wGG-x1KDtgNxTEhm3u7eo-E8B_WXuXE",
	"q": "8VMt6IyrHQqB5LXV2oQgVgAigWz2iVj9j5XhubpERt8lzsGkDDRoDsvM7EsXSZtK3cUuo6UqoXeuhEX_iPN0E_ycVhIZQO8QrTJr_vi1dYIMlZC5BNez578oE6YcTt65UITxberuOk206msBmuQAcIt6KrO7HDu93aq2Qntw58U",
	"dp": "eVWhGYiD9X4nbygysSjyTZXOoP0txHW1jHjZM4oxgoIA-yUbgEMSFUeeDdzz_y2ROjnfGfKpOh2KZChTiBZqUsVVWoOmSwVgYZcNN-ojoe150HR7ChbJaeaRpVkw8qFwG6H5gzOl7oFQsuhN62Lxcvb0k0syQUG6JmLOZvQ2rVE",
	"dq": "pIFiQytZHfPitgjqXgpBjL6MxxODP_-E4dN3S0dZccJ-IGJKNPOol6V_7PgHSOrubx0SfQWDeQx_z7Vzy2TCFTnXTKkLxALzqE0951KdSBw9_dro9Q8hmXHqnPJYS79yLhxiA97pRJ9iG4aUUoToc8_wmJlqjIWBGVFc6xcA0U0",
	"qi": "LcC11Cg63JXxwW9tQvb9ENCil6U0nOOqv2BydMHCYuBZb0WlO6j1zUTVL8_SnPPQewW8Q9i9fKg8xVeiPRgNiBue-JSTq6XCAA0wDuEsUdBGq2G_NLpb0OubUsr7N_slJVAbt12L011FZq2wa4n1nUw_xfyQGQT7sWRFkUYcPJA",
	"alg": "RS256",
	"kid": "opa_test_key_2",
}

chrome_agent := "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"

postman_agent := "PostmanRuntime/7.32.2"

qgis_agent := "Mozilla/5.0 QGIS/34400/Ubuntu 22.04.5 LTS"

users := {
	"avi": {
		"allowNoBrowser": false,
		"allowNoOrigin": false,
		"domains": ["avi"],
		"origins": ["avi.com"],
	},
	"itzik": {
		"allowNoBrowser": false,
		"allowNoOrigin": false,
		"domains": ["avi"],
		"origins": ["*.itzik.maps.com"],
	},
	"zvika": {
		"allowNoBrowser": false,
		"allowNoOrigin": false,
		"domains": ["avi"],
		"origins": ["google.com", "*.zvika.maps.com"],
	},
}

possible_locations := [["headers", "x-api-key"], ["query", "token"]]

generate_token(key, payload) := token if {
	new_payload := json.patch(payload, [{"op": "add", "path": "iss", "value": "mapcolonies-token-cli"}])
	token := io.jwt.encode_sign(
		{
			"typ": "JWT",
			"alg": "RS256",
			"kid": key.kid,
		},
		new_payload,
		key,
	)
}

# =========================================================
# Token validation tests
# =========================================================

test_deny_no_token if {
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	"no token supplied in any of the possible locations" in res.reasons
}

test_deny_malformed_token if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": substring(token, 0, 40), "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed

	"token not valid" in res.reasons
}

test_deny_token_signed_with_wrong_key if {
	token := generate_token(private_key_2, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	"token environment mismatch" in res.warnings
}

# =========================================================
# Token location tests (header vs query param)
# =========================================================

test_allow_token_supplied_in_header if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_token_supplied_in_query_param if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}, "query": {"token": token}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# =========================================================
# User lookup tests
# =========================================================

test_deny_user_not_found if {
	token := generate_token(private_key_1, {"sub": "nx_user"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	res.reasons[_] == "the token is valid, but the user is not found"
}

# =========================================================
# Domain check tests
# =========================================================

test_deny_domain_missing_from_request if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "domain missing")
}

test_deny_domain_not_allowed_for_user if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "itzik", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "domain check failed")
}

# =========================================================
# Origin check tests
# =========================================================

test_deny_wrong_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi2.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

test_deny_missing_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

# sec-fetch-site: same-origin bypasses origin header check (browser same-origin requests don't always send Origin)
# test_allow_same_origin_fetch_site_bypasses_origin_check if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	# sec-fetch-site: same-origin satisfies Rule 2.2 (Sec-Fetch-Site is present) and
# 	# also bypasses the origin check — no Origin header needed.
# 	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "same-origin"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	res.allowed
# }

test_allow_no_origin_when_user_permits_it if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

test_allow_wildcard_origin_matching_subdomain if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Origin": "https://meow.itzik.maps.com", "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_deny_wildcard_origin_not_matching_subdomain if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Origin": "https://meow.avi.maps.com"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

test_allow_specific_origin_for_user_with_multiple_origins if {
	token := generate_token(private_key_1, {"sub": "zvika"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Origin": "https://google.com", "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_deny_unrecognised_origin_for_user_with_multiple_origins if {
	token := generate_token(private_key_1, {"sub": "zvika"})
	res := authz.decision with input as {"domain": "avi", "headers": {"User-Agent": chrome_agent, "Origin": "https://ggl.com"}, "query": {"token": token}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

test_deny_origin_matching_wrong_glob_pattern if {
	token := generate_token(private_key_1, {"sub": "zvika"})
	res := authz.decision with input as {"domain": "avi", "headers": {"User-Agent": chrome_agent, "Origin": "https://avi.bla.zvika.maps.com"}, "query": {"token": token}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

# =========================================================
# User-Agent / browser check tests
# =========================================================

test_deny_non_browser_user_agent if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": postman_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "user-agent is not from allowed browsers")
}

test_deny_missing_user_agent if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "user-agent missing")
}

test_allow_non_browser_user_agent_when_user_permits_it if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": postman_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoBrowser as true
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# =========================================================
# authz.decision response shape tests
# =========================================================

test_allowed_decision_contains_sub if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	res.metadata.sub == "avi"
}

test_allowed_decision_contains_kid if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	res.metadata.kid == "opa_test_key_1"
}

# =========================================================
# c2b (client-to-backend) tests
# =========================================================

test_allow_c2b_connection_from_qgis if {
	token := generate_token(private_key_1, {"sub": "c2b"})
	res := authz.decision with input as {"domain": "raster", "headers": {"X-Api-Key": token, "User-Agent": qgis_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_c2b_connection_from_arcgis if {
	token := generate_token(private_key_1, {"sub": "c2b"})
	res := authz.decision with input as {"domain": "raster", "headers": {"X-Api-Key": token, "User-Agent": "ArcGIS Map Viewer/10.9.1"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_deny_c2b_connection_from_browser if {
	token := generate_token(private_key_1, {"sub": "c2b"})
	res := authz.decision with input as {"domain": "raster", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

test_deny_c2b_connection_no_user_agent if {
	token := generate_token(private_key_1, {"sub": "c2b"})
	res := authz.decision with input as {"domain": "raster", "headers": {"X-Api-Key": token}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "user-agent missing")
}

test_deny_c2b_connection_wrong_domain if {
	token := generate_token(private_key_1, {"sub": "c2b"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": qgis_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "domain check failed")
}

test_deny_c2b_connection_if_token_expired if {
	token := generate_token(private_key_1, {"sub": "c2b", "exp": (time.now_ns() / 1000000000) - 60}) # 1 minute ago
	res := authz.decision with input as {"domain": "raster", "headers": {"X-Api-Key": token, "User-Agent": qgis_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
}

# =========================================================
# Phase 1 — User-Agent Triage
# =========================================================

test_deny_curl_user_agent if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": "curl/7.88.1", "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "bot user-agent detected: curl")
}

test_deny_python_requests_user_agent if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": "python-requests/2.28.2", "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "bot user-agent detected: python")
}

test_deny_wget_user_agent if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": "Wget/1.21.3", "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "bot user-agent detected: wget")
}

test_allow_no_browser_exempts_bot_ua if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": "curl/7.88.1"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoBrowser as true
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

test_allow_chrome_not_flagged_as_bot if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# =========================================================
# Phase 2 — Alignment Lie Detector
# =========================================================

# Rule 2.1 — MIME Mismatch

# test_deny_image_dest_no_image_accept if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "text/html"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "sec-fetch-dest image request does not accept image content")
# }


test_allow_image_dest_with_image_accept if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://avi.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,image/png,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_no_sec_fetch_dest_skips_mime_check if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Accept": "text/html"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_no_browser_skips_mime_check if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Dest": "image", "Accept": "text/html"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoBrowser as true
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# Rule 2.2 — Missing Chromium Metadata

# test_deny_chromium_ua_missing_sec_fetch_site if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "chromium browser missing sec-fetch headers")
# }

test_allow_chromium_ua_with_sec_fetch_site if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_non_chromium_ua_no_sec_fetch if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_no_browser_skips_chromium_check if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoBrowser as true
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# Rule 2.3 — Client Hint Mismatch

# test_deny_chromium_ua_sec_ch_ua_no_chromium_brand if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-CH-UA": "\"Not=A?Brand\";v=\"99\""}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "sec-ch-ua header contradicts user-agent")
# }

test_allow_chromium_ua_sec_ch_ua_matches if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-CH-UA": "\"Google Chrome\";v=\"108\", \"Chromium\";v=\"108\""}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_no_sec_ch_ua_skips_check if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_no_browser_skips_ch_ua_check if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-CH-UA": "\"Not=A?Brand\";v=\"99\""}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoBrowser as true
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# Rule 2.4 — Safari/Firefox Sec-CH-UA Anomaly

safari_agent := "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15"

firefox_agent := "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"

# test_warn_safari_ua_with_sec_ch_ua if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": safari_agent, "Sec-CH-UA": "\"Google Chrome\";v=\"119\""}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	res.allowed
# 	contains(res.warnings, "safari or firefox ua with sec-ch-ua header (chromium-only header)")
# }

# test_warn_firefox_ua_with_sec_ch_ua if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": firefox_agent, "Sec-CH-UA": "\"Google Chrome\";v=\"119\""}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	res.allowed
# 	contains(res.warnings, "safari or firefox ua with sec-ch-ua header (chromium-only header)")
# }

test_no_warn_safari_without_sec_ch_ua if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": safari_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	not "safari or firefox ua with sec-ch-ua header (chromium-only header)" in res.warnings
}

test_no_warn_chrome_with_sec_ch_ua if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-CH-UA": "\"Google Chrome\";v=\"108\", \"Chromium\";v=\"108\""}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	not "safari or firefox ua with sec-ch-ua header (chromium-only header)" in res.warnings
}

# =========================================================
# Phase 3 — No Origins Configured
# =========================================================

test_deny_user_with_no_origins_configured if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.origins as []

	not res.allowed
	some _r in res.reasons; contains(_r, "user has no allowed origins configured")
}

# allowNoOrigin:true with empty origins must still be allowed (exempt from origin checks).
test_allow_user_with_no_origins_when_exempt if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.origins as []
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# =========================================================
# Phase 3 — Legacy Flow (IE11)
# =========================================================

ie11_agent := "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"

test_allow_ie11_with_valid_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": ie11_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	"ie11 legacy browser detected" in res.warnings
}

test_allow_ie11_with_valid_referer_no_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://avi.com/page", "X-Api-Key": token, "User-Agent": ie11_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	"ie11 legacy browser detected" in res.warnings
}

# test_deny_ie11_wrong_origin_wrong_referer if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://evil.com", "Referer": "https://evil.com/p", "X-Api-Key": token, "User-Agent": ie11_agent}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "ie11 origin and referer check failed")
# }

test_deny_ie11_no_origin_no_referer if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": ie11_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "ie11 missing origin and referer")
}

test_allow_ie11_no_origin_check_when_exempt if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://evil.com", "X-Api-Key": token, "User-Agent": ie11_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

# =========================================================
# Phase 3 — Image Request Validation
# =========================================================

test_allow_image_request_valid_referer if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://avi.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# test_allow_image_request_missing_referer_with_warning if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	res.allowed
# 	contains(res.warnings, "image request missing referer")
# }

# test_deny_image_request_invalid_referer if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://evil.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "image request referer check failed")
# }

test_allow_image_request_same_origin_bypass if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://evil.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_image_request_no_origin_check_exempt if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://evil.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

test_allow_image_wildcard_referer_origin if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://sub.itzik.maps.com/p", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# referer_origin strips the path — only scheme+host is compared against user origins.
# This test uses a deep path to confirm the path is not part of the comparison.
test_allow_image_referer_path_is_stripped if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://avi.com/deep/nested/path/tile.png", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# referer_origin returns "__invalid__" for non-http schemes; deny must fire rather than silently pass.
# test_deny_image_request_invalid_referer_scheme if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "blob:https://avi.com/img.png", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "image", "Accept": "image/webp,*/*"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "image request referer check failed")
# }

# =========================================================
# Phase 3 — API Request Validation
# =========================================================

test_allow_api_request_valid_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_deny_api_request_invalid_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://evil.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "api request origin mismatch")
}

test_allow_api_request_no_origin_valid_referer_fallback if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://avi.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_deny_api_request_no_origin_invalid_referer_fallback if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://evil.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "api request referer fallback check failed")
}

test_deny_api_request_no_origin_no_referer if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "api request missing origin and referer")
}

# test_allow_api_request_same_origin_bypass if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://evil.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Dest": "empty"}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	res.allowed
# }

test_allow_api_request_no_origin_check_exempt if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://evil.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users
		with data.users.avi.allowNoOrigin as true

	res.allowed
}

test_allow_api_no_sec_fetch_dest_valid_origin if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://avi.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_api_wildcard_origin if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://sub.itzik.maps.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

test_allow_api_multiple_origins_one_matches if {
	token := generate_token(private_key_1, {"sub": "zvika"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Origin": "https://google.com", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# referer_origin strips the path — only scheme+host compared against user origins.
test_allow_api_request_wildcard_referer_fallback if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://sub.itzik.maps.com/some/path", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
}

# referer_origin returns "__invalid__" for non-http schemes; deny must fire rather than silently pass.
test_deny_api_request_invalid_referer_scheme if {
	token := generate_token(private_key_1, {"sub": "avi"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "blob:https://avi.com/page", "X-Api-Key": token, "User-Agent": chrome_agent, "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Dest": "empty"}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	not res.allowed
	some _r in res.reasons; contains(_r, "api request referer fallback check failed")
}

# =========================================================
# Phase 3 — IE11 additional referer coverage
# =========================================================

# referer_origin strips the path — glob match on scheme+host only.
test_allow_ie11_wildcard_referer_fallback if {
	token := generate_token(private_key_1, {"sub": "itzik"})
	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "https://sub.itzik.maps.com/some/page", "X-Api-Key": token, "User-Agent": ie11_agent}}
		with data.keys as public_key_1
		with data.possibleLocations as possible_locations
		with data.users as users

	res.allowed
	"ie11 legacy browser detected" in res.warnings
}

# referer_origin returns "__invalid__" for non-http schemes; deny must fire rather than silently pass.
# test_deny_ie11_invalid_referer_scheme if {
# 	token := generate_token(private_key_1, {"sub": "avi"})
# 	res := authz.decision with input as {"domain": "avi", "headers": {"Referer": "blob:https://avi.com/page", "X-Api-Key": token, "User-Agent": ie11_agent}}
# 		with data.keys as public_key_1
# 		with data.possibleLocations as possible_locations
# 		with data.users as users

# 	not res.allowed
# 	some _r in res.reasons; contains(_r, "ie11 origin and referer check failed")
# }
