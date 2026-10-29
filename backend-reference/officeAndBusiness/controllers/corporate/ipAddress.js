const asyncHandler = require("../../middlewares/async");

exports.getIpAddress = asyncHandler(async (req, res) => {
    const userIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("-------------------------------------------------------------")
    console.log("-------------------------------------------------------------")
    console.log(`---------------IP ADDRESS : ${userIpAddress}-----------------`)
    console.log("-------------------------------------------------------------")
    console.log("-------------------------------------------------------------")

    return res.status(200).json({
        status: true,
        data: userIpAddress,
        message: "IP Address Fetched Successfully",
        responseCode: '000'
    });
});