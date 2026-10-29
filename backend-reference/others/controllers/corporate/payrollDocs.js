const asyncHandler = require("../../middlewares/async");
const payrollCategory = require("../../models/entities/payrollCategories");
const payrollDocuments = require("../../models/entities/payrollSubcategories");
// const { findServiceOperatorByAccessKey } = require('./../../utils/checkAndFetchServiceDetails'); // F-OTH-21: only used by the disabled vendorDetails below
const { Op } = require("sequelize");
// const ErrorResponse = require("./../../utils/error-response"); // F-OTH-21: only used by the disabled vendorDetails below
// const { customLog } = require("./../../utils/loggerHelper"); // F-OTH-21: only used by the disabled vendorDetails below

exports.listPayrollTemplatesByCategory = asyncHandler(async (req, res) => {
  const categories = await payrollCategory.findAll({
    where: { categoryStatus: true },
    attributes: ["id", "categoryName"],
    raw: true,
  });

  const categoryIds = categories.map((category) => category.id);

  if (!categoryIds.length) {
    return res.status(200).json({
      status: true,
      message: "Payroll templates fetched successfully",
      data: { categoryDataWithDocuments: [] },
      responseCode: "000",
    });
  }

  const documents = await payrollDocuments.findAll({
    where: {
      categoryId: { [Op.in]: categoryIds },
      documentStatus: true,
      document: { [Op.ne]: null },
    },
    attributes: ["id", "categoryId", "documentName", "document"],
    raw: true,
  });

  const categoryDataWithDocuments = categories
    .map((category) => {
      const docs = documents
        .filter((doc) => doc.categoryId === category.id)
        .map((doc) => ({
          id: doc.id,
          name: doc.documentName,
          document: doc.document,
        }));

      return {
        id: category.id,
        categoryName: category.categoryName,
        documents: docs,
      };
    })
    .filter((category) => category.documents.length > 0);

  return res.status(200).json({
    status: true,
    message: "Payroll templates fetched successfully",
    data: { categoryDataWithDocuments },
    responseCode: "000",
  });
});

// F-OTH-21: disabled — returned raw vendor API credentials (vendor.apiUrl/optional1-5) to
// any corporate session for any accessKey supplied in the request body. No legitimate
// caller was found. The proper, service-authenticated replacement is
// /corporate/:corporateId/others/internal/service-operators/by-access-key/:accessKey.
// exports.vendorDetails = asyncHandler(async (req, res, next) => {
//   try {
//     const { accessKey } = req.body;
//
//     if (!accessKey) {
//       return next(new ErrorResponse("Access key is required", 400));
//     }
//
//     const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
//
//     if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
//       return next(new ErrorResponse(serviceDetails.error, 400));
//     }
//
//     return res.status(200).json({
//       status: true,
//       message: "Vendor details fetched successfully",
//       data: { serviceDetails },
//       responseCode: "000",
//     });
//   } catch (err) {
//     customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
//     return res.status(400).json({
//       status: false,
//       message: "Something went wrong. Please try again later.",
//       data: {},
//       responseCode: "001",
//     });
//   }
// });