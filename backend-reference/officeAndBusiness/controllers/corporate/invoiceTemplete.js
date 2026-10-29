const asyncHandler = require("../../middlewares/async");
const { getAllTemplete, getHtmlTemplates } = require("../../models/use-cases/invoiceTemplete");
const ErrorResponse = require("../../utils/error-response");

exports.getHtmlTemplate = asyncHandler(async (req, res) => {
    try {
        const data = await getHtmlTemplates()

        return res.status(200).json({
            status: true,
            data,
            message: 'Templates fetched successfully',
            responseCode: '000',
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001',
        })
    }
})

exports.getAllTemplete = asyncHandler(async (req, res, next) => {
  try {
    let status = true;
    const result = await getAllTemplete(status);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while getting templete`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: result,
        message: "Templete fetched successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});
