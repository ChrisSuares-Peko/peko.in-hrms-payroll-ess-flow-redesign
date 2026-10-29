const { customLog } = require("../../utils/loggerHelper");
const oauth_clients = require("../entities/oauth_clients");

exports.findOauthClientDetails = async (client_id, attributes = undefined) => {
  try {
    const client = await oauth_clients.findOne({
      where: {
        client_id,
      },
      attributes,
      raw: true,
      nest: true,
    });
    return client;
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth Client fetching from DB failed:",
      error,
    });
    return false;
  }
};
