function transform_opa_log(tag, timestamp, record)
    local new_record = {}
    -- 1. Input and Bundles
    new_record["input"] = record["input"]
    new_record["bundles"] = record["bundles"]

    -- 2. Trace & Span IDs
    new_record["trace_id"] = record["trace_id"]
    new_record["span_id"] = record["span_id"]

    -- 3. Extract Environment and Domain
    if record["labels"] ~= nil then
        new_record["env"] = record["labels"]["environment"]
    end
    
    new_record["opa_domain"] = record["input"]["domain"]


    new_record["token_location"] = "missing"
    if record["input"]["headers"] ~= nil and record["input"]["headers"]["x-api-key"] ~= nil then
        new_record["token_location"] = "header"
    end

    if record["input"]["query"] ~= nil and record["input"]["query"]["token"] ~= nil then
        if new_record["token_location"] == "header" then
            new_record["token_location"] = "both"
        else
            new_record["token_location"] = "query"
        end
    end

    if record["input"]["headers"] ~= nil then 
        if record["input"]["headers"]["origin"] ~= nil then
            new_record["origin"] = record["input"]["headers"]["origin"]
        end
        if record["input"]["headers"]["user-agent"] ~= nil then
            new_record["user_agent"] = record["input"]["headers"]["user-agent"]
        end
    end

    -- 4. Requested By
    new_record["requested_by"] = record["requested_by"]

    -- 5. Result splits
    if record["result"] ~= nil then
        -- Loki metadata requires strings, so we cast the boolean
        new_record["allowed"] = tostring(record["result"]["allowed"])
        new_record["reason"] = record["result"]["reason"]
        new_record["sub"] = record["result"]["sub"]
        new_record["codes"] = record["result"]["codes"]
    end

    -- 6. The original OPA timestamp string
    new_record["opa_timestamp"] = record["timestamp"]

    -- 7. Total processing time
    if record["metrics"] ~= nil then
        new_record["total_time_ns"] = tostring(record["metrics"]["timer_server_handler_ns"])
    end

    -- We return the Fluent Bit ingestion timestamp as the official log time.
    return 1, timestamp, new_record
end
