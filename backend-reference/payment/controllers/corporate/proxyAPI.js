const axios = require("axios");
const https = require("https");
const { customLog } = require("../../utils/loggerHelper");

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

exports.proxyAPIForTest = async (req, res) => {
  const traceId = req?.LogTraceId;
  try {
    const axiosConfig = req.body;

    if (!axiosConfig.method || !axiosConfig.url) {
      return res.status(400).json({ error: "Method and URL are required in the request body." });
    }

    customLog(traceId, "info", {
      message: "proxyAPIForTest: outgoing request",
      url: axiosConfig.url,
      method: axiosConfig.method,
      headers: axiosConfig.headers,
      data: axiosConfig.data,
    }, "VENDOR");

    const response = await axios({ ...axiosConfig, httpsAgent: insecureAgent });

    customLog(traceId, "info", {
      message: "proxyAPIForTest: vendor response received",
      url: axiosConfig.url,
      statusCode: response.status,
      response: response.data,
    }, "VENDOR");

    return res.status(200).json({
      status: true,
      data: { config: axiosConfig, response: response.data },
    });
  } catch (error) {
    customLog(traceId, "error", {
      message: "proxyAPIForTest: vendor request failed",
      url: req.body?.url,
      errorMessage: error?.message,
      errorCode: error?.code,
      statusCode: error?.response?.status,
      errorResponse: error?.response?.data,
    }, "VENDOR");

    return res.status(400).json({
      status: false,
      data: {
        error: error?.response?.data ?? error?.response ?? null,
        message: error?.message ?? null,
        code: error?.code ?? null,
        statusCode: error?.response?.status ?? null,
      },
    });
  }
};
