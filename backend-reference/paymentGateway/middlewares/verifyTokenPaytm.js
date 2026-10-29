const jwt = require("jsonwebtoken");
const operatorsData = require("../utils/operatorsData.json");
const {
  findServiceOperatorByAccessKey,
} = require("../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../utils/error-response");
const accessKey = operatorsData["giftCard"]["accessKey"];

exports.verifyTokenPaytm = async (req, res, next) => {
  const authorizationHeader = req.header("Authorization");
  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Missing token" });
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }

  let secretKey = serviceDetails.vendor.optional2; // clientSecret, shared by paytm
  secretKey = Buffer.from(secretKey, "base64");

  try {
    jwt.verify(token, secretKey, (err, decoded) => {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      const tokenIssuedAt = decoded.iat;
      const timeDifferenceInSeconds = currentTimeInSeconds - tokenIssuedAt;

      if (err || timeDifferenceInSeconds > 300) {
        // not valid after 5 minutes
        // Token is invalid or expired
        console.error("Error while verifying token:", err.message);
        return res
          .status(500)
          .json({ message: "Unauthorized - Invalid token" });
      } else {
        // Token is valid
        console.log("Token is valid.");
        console.log("Decoded:", decoded);
        next();
      }
    });
  } catch (error) {
    console.log("Error from catch: ", error);
    return res.status(500).json({ message: "Unauthorized - Invalid token" });
  }
};
