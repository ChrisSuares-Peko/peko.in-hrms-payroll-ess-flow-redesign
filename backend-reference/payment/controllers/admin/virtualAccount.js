// F-PAY-20: dead Decentro VA controller (replaced by NuPay) — commented out, not removed.
/*
const asyncHandler = require("../../middlewares/async");
const { createVirtualAccount } = require("../../utils/decentroGateway");
const { v4: uuidv4 } = require("uuid");

exports.createVA = asyncHandler(async (req, res) => {
  const { name, mobile, email, ifsc, generateStaticQr, referenceId } = req.body;

  if (!name) {
    return res.status(400).json({
      status: false,
      message: "name is required",
      responseCode: "400",
    });
  }

  const refId = referenceId || `VA_${uuidv4().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

  const data = await createVirtualAccount({ referenceId: refId, name, mobile, email, ifsc, generateStaticQr });

  return res.status(200).json({
    status: true,
    message: "Virtual account created successfully",
    responseCode: "000",
    data,
  });
});
*/
