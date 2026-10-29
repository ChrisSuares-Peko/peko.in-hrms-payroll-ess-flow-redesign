const crypto = require("crypto");
const axios = require("axios");

const sign = (rawBody, secret) =>
  `sha256=${crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;

exports.postTenantApi = async ({ apiUrl, secret, path, payload }) => {
  const rawBody = JSON.stringify(payload);
  return axios.post(`${apiUrl}${path}`, rawBody, {
    headers: {
      "Content-Type": "application/json",
      "X-Peko-Api-Signature": sign(rawBody, secret),
    },
    timeout: 10_000,
    transformRequest: [(d) => d],
  });
};

exports.postWebhook = async ({ apiUrl, secret, payload }) => {
  const rawBody = JSON.stringify(payload);
  return axios.post(`${apiUrl}/peko/webhooks/subscription`, rawBody, {
    headers: {
      "Content-Type": "application/json",
      "X-Peko-Signature": sign(rawBody, secret),
    },
    timeout: 10_000,
    transformRequest: [(d) => d],
  });
};

exports.sign = sign;
