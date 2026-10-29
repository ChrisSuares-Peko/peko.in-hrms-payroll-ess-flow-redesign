const axios = require("axios");

async function activateEsim({ url, token, payload }) {

  const response = await axios({
    method: "post",
    url,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    data: payload
  });

  if (response?.data?.errorcode || response?.data?.errorCode) {
    throw new Error("Vendor activation failed");
  }

  return response.data;
}

module.exports = { activateEsim }