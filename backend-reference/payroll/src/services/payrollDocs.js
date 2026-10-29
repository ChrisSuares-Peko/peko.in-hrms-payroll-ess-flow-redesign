const axios = require("axios");

async function fetchPayrollTemplatesFromOthers({ corporateId, headers = {} }) {
  let serverUrl;
  if (process.env.NODE_ENV == 'staging') {
    serverUrl = process.env.STAGING_URL;
  }
  else{
    serverUrl = process.env.SERVER_URL;
  }
  
  const url = `${serverUrl}/api/v1/corporate/${corporateId}/others/payrollDocs/templates`;

  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      Authorization: headers.authorization,
      sessionid: headers.sessionid,
      'x-user-key': headers['x-user-key'],
    },
  });

  return data;
}

module.exports = { fetchPayrollTemplatesFromOthers };
