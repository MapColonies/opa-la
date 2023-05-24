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
      },
    };

    const response = await r.subrequest('/opa', {
      body: JSON.stringify(body),
      method: 'POST',
    });

    if (response.status > 500) {
      return r.return(response.status);
    }

    r.error(response.status);

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

export default { opaAuth };
