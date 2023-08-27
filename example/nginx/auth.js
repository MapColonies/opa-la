import qs from 'querystring';

async function opaAuth(r) {
  try {
    if (r.variables.original_method == 'OPTIONS') {
      return r.return(204);
    }

    const body = {
      input: {
        method: r.variables.original_method,
        headers: r.headersIn,
        // uri: r.variables,
        // host: r.variables,
        query: qs.parse(r.variables.original_args),
        domain: '',
      },
    };

    const response = await r.subrequest('/opa', {
      body: JSON.stringify(body),
      method: 'POST',
    });

    if (response.status > 500) {
      return r.return(response.status);
    }

    const opaResult = JSON.parse(response.responseText).result;
    if (!opaResult.allowed) {
      r.error(opaResult.reason);
      const returnCode = opaResult.reason.includes('no token supplied') ? 401 : 403;

      return r.return(returnCode);
    }

    r.return(204);
  } catch (error) {
    r.error(error);
    r.return(500);
  }
}

function jwt(data) {
  if (data) {
    var parts = data
      .split('.')
      .slice(0, 2)
      .map((v) => Buffer.from(v, 'base64url').toString())
      .map(JSON.parse);
    return { headers: parts[0], payload: parts[1] };
  } else {
    return;
  }
}

function jwt_payload_sub(r) {
  try {
    let token;
    if (r.args['token']) token = jwt(r.args['token']);
    else if (r.headersIn['x-api-key']) token = jwt(r.headersIn['x-api-key']);
    else return '';

    return token.payload.sub;
  } catch (error) {
    return '';
  }
}

export default { opaAuth, jwt_payload_sub };
