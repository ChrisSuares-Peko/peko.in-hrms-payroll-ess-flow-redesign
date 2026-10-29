const {
  findAllPackageCashbackCount,
  create,
  update,
  deleteCashback,
  findOne,
  packageCashbackAndCountExport,
} = require("../../models/use-cases/cashback");
const {
  listSubscriptionAddOns,
  serializeSubscriptionAddOn,
} = require("../../models/use-cases/subscriptionAddOns");
const {
  findPartnerPackagesAndCashbacks,
  clonePackageToPartner,
  addCashbacksToTargetPackage,
} = require("../../models/use-cases/cashbackCopy");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require("puppeteer");
const fs = require("fs");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const cashback = require("../../models/entities/cashback");
const {
  Op
} = require("sequelize");

exports.findAllPackageCashbackAndCount = asyncHandler(async (req, res, next) => {

  let { searchText, page, itemsPerPage,partnerId, serviceOperatorId } = req.query;
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'createdAt'

   // Parse page and itemsPerPage to integers (you can also use parseInt)
   page = page ? parseInt(page) : 1;
   itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
   let limit = itemsPerPage

   // Calculate offset based on page and itemsPerPage
   let offset;
   if (page && itemsPerPage) {
       offset = (page - 1) * itemsPerPage;
   }

  let params = {
      limit, offset, searchText, sort, sortField ,partnerId, serviceOperatorId
  };

  const packageCashbackData = await findAllPackageCashbackCount(params);
  if (!packageCashbackData) {
    return next(new ErrorResponse(`Something went wrong while getting all packages from database`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {data : packageCashbackData ? packageCashbackData.rows : 0,
          recordsTotal : packageCashbackData ? packageCashbackData.count : 0 },
      message : 'Cashback fetched successfully.',
      responseCode : '000'
    });
  }
});

// Every eligible package for Peko Subscriptions' Add-ons tab, configured or not.
exports.getSubscriptionAddOns = asyncHandler(async (req, res) => {
  let { searchText, page, itemsPerPage, partnerId, kind } = req.query;

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  const offset = (page - 1) * itemsPerPage;

  const result = await listSubscriptionAddOns({
    partnerId,
    kind,
    searchText: searchText || "",
    limit: itemsPerPage,
    offset,
  });

  return res.status(200).json({
    status: true,
    data: {
      data: result.rows.map(serializeSubscriptionAddOn),
      recordsTotal: result.count,
    },
    message: "Subscription add-ons fetched successfully.",
    responseCode: "000",
  });
});

exports.packageCashbackAndCountExcelCSV = asyncHandler(
  async (req, res, next) => {
    let { searchText,partnerId } = req.query;
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";

    let params = {
      searchText,
      sort,
      sortField,
      partnerId
    };

    const data = await packageCashbackAndCountExport(params);
    if (!data || data.length < 1) {
      return next(
        new ErrorResponse(`Something went wrong while generating report`, 500)
      );
    } else {
      const { buffer, fileType } = await generateExcelBufferAndType(data, type);
      return res.status(200).json({
        status: true,
        data: { buffer, fileType },
        message: "Fetched excel/csv datas successfully",
        responseCode: "000",
      });
    }
  }
);

exports.packageCashbackAndCountPDF = asyncHandler(async (req, res, next) => {
  let { searchText,partnerId } = req.query;
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    searchText,
    sort,
    sortField,
    partnerId,
  };

  const data = await packageCashbackAndCountExport(params);
  if (!data || data.length < 1) {
    return next(
      new ErrorResponse(`Something went wrong while generating report`, 500)
    );
  }

  const templateDetails = {
    title: 'Cashbacks',
  }
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
  let random = new Date().valueOf();

  let browser;
  try {
    // Create a browser instance with Puppeteer
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
      path: outputFile,
      format: "A4",
      preferCSSPageSize: true,
    });

    console.log("PDF generated successfully!");

    const buffer = fs.readFileSync(outputFile);

    fs.unlinkSync(outputFile);

    return res.status(200).json({
      status: true,
      message: "report generated successfully.",
      data: {
        buffer,
        fileType: "application/pdf",
      },
      responseCode: "000",
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
});

exports.createCashback = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const isExists = await findOne(data);

  if (isExists) {
    return next(new ErrorResponse(`Cashback already exists`, 403));
  }

  const result = await create(data);

  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while adding the cashback`, 500)
    );
  }
  return res.status(200).json({
    status: true,
    data: result,
    message: "Cashback added successfully",
    responseCode: "000",
  });
});

exports.updateCashback = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const isExists = await findOne(data);

  if (isExists && isExists.id != params.id) {
    return next(new ErrorResponse(`Cashback Already exists`, 403));
  }

  const result = await update(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating the cashback`, 200)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {},
      message: "Cashback updated successfully",
      responseCode: "000",
    });
  }
});

exports.deleteCashback = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await deleteCashback(params);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while deleting the cashback`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "cashback deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await update(params, data);

  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.bulkCreateCashback = asyncHandler(async (req, res, next) => {
  const serviceOperators = [
    {
      id: 15,
      serviceProvider: "Gift Cards/Vouchers",
    },
    {
      id: 18,
      serviceProvider: "Office Supplies",
    },
    {
      id: 20,
      serviceProvider: "zero Carbon",
    },
    {
      id: 21,
      serviceProvider: "Payment Links",
    },
    {
      id: 23,
      serviceProvider: "Peko Connect",
    },
    {
      id: 24,
      serviceProvider: "Office Address",
    },
    {
      id: 25,
      serviceProvider: "Invoice",
    },
    {
      id: 26,
      serviceProvider: "eDocs",
    },
    {
      id: 28,
      serviceProvider: "Airline",
    },
    {
      id: 29,
      serviceProvider: "Hotels",
    },
    {
      id: 30,
      serviceProvider: "Shipment Services",
    },
    {
      id: 34,
      serviceProvider: "Softwares",
    },
    {
      id: 35,
      serviceProvider: "Gift Cards",
    },
    {
      id: 36,
      serviceProvider: "Document Attestation",
    },
    {
      id: 43,
      serviceProvider: "Premo Gift Cards",
    },
    {
      id: 45,
      serviceProvider: "Telecom Postpaid",
    },
    {
      id: 46,
      serviceProvider: "Electricity",
    },
    {
      id: 47,
      serviceProvider: "LPG Cylinder",
    },
    {
      id: 48,
      serviceProvider: "Water",
    },
    {
      id: 49,
      serviceProvider: "Broadband",
    },
    {
      id: 50,
      serviceProvider: "Landline",
    },
    {
      id: 51,
      serviceProvider: "Piped Gas",
    },
    {
      id: 52,
      serviceProvider: "Education Fees",
    },
    {
      id: 53,
      serviceProvider: "Telecom Prepaid",
    },
    {
      id: 54,
      serviceProvider: "Plural",
    },
    {
      id: 55,
      serviceProvider: "QR Payments",
    },
    {
      id: 56,
      serviceProvider: "Carbon Footprint",
    },
    {
      id: 57,
      serviceProvider: "PAYTM KYC",
    },
    {
      id: 58,
      serviceProvider: "Paytm Payment Gateway",
    },
    {
      id: 60,
      serviceProvider: "Paytm GiftCards",
    },
    {
      id: 61,
      serviceProvider: "Golden Gate",
    },
    {
      id: 63,
      serviceProvider: "Peko Works",
    },
    {
      id: 64,
      serviceProvider: "E Sign",
    },
    {
      id: 65,
      serviceProvider: "WhatsApp for business",
    },
    {
      id: 66,
      serviceProvider: "Peko Cloud",
    },
    {
      id: 67,
      serviceProvider: "Payroll",
    },
    {
      id: 68,
      serviceProvider: "Hola",
    },
    {
      id: 69,
      serviceProvider: "Hike",
    },
    {
      id: 70,
      serviceProvider: "Business Emails",
    },
    {
      id: 71,
      serviceProvider: "Freshdesk",
    },
    {
      id: 72,
      serviceProvider: "Dviz Technologies",
    },

    {
      id: 76,
      serviceProvider: "Account",
    },
  ];
  const packageIds = [55, 63];
  const commonData = {
    cashbackType: "PERCENTAGE",
    surchargeType: "PERCENTAGE",
    cashback: "0",
    surcharge: "0",
    unitPrice: "0",
    baseLimit: "0",
  };
  // Prepare rows to insert
  const rowsToInsert = [];
  for (const serviceOperator of serviceOperators) {
    for (const packageId of packageIds) {
      rowsToInsert.push({
        ...commonData,
        serviceOperatorId: serviceOperator.id,
        packageId,
      });
    }
  }
  try {
    // Check if any cashback already exists for the given combinations
    const existingCashbacks = await cashback.findAll({
      where: {
        [Op.or]: rowsToInsert.map((row) => ({
          serviceOperatorId: row.serviceOperatorId,
          packageId: row.packageId,
        })),
      },
    });

    if (existingCashbacks.length > 0) {
      return next(
        new ErrorResponse(
          `Some cashback entries already exist for the provided combinations`,
          403
        )
      );
    }

    // Bulk create cashbacks
    const result = await cashback.bulkCreate(rowsToInsert);

    if (!result) {
      return next(
        new ErrorResponse(
          `Something went wrong while adding cashback entries`,
          500
        )
      );
    }

    return res.status(200).json({
      status: true,
      data: result,
      message: "Cashback entries added successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error("Error creating cashback entries:", error.message);
    return next(new ErrorResponse("Internal server error", 500));
  }
});

exports.getCopyCashbackCompare = asyncHandler(async (req, res, next) => {
  const { fromPartnerId, toPartnerId } = req.query;
  if (!fromPartnerId || !toPartnerId) {
    return next(new ErrorResponse('fromPartnerId and toPartnerId are required', 400));
  }
  if (String(fromPartnerId) === String(toPartnerId)) {
    return next(new ErrorResponse('Source and destination partners must be different', 400));
  }
  const [from, to] = await Promise.all([
    findPartnerPackagesAndCashbacks(fromPartnerId),
    findPartnerPackagesAndCashbacks(toPartnerId),
  ]);
  return res.status(200).json({
    status: true,
    data: { from, to },
    message: 'Compare data fetched successfully',
    responseCode: '000',
  });
});

exports.clonePackageToTargetPartner = asyncHandler(async (req, res, next) => {
  const { fromPackageId, toPartnerId, overrides } = req.body;
  if (!fromPackageId) {
    return next(new ErrorResponse('fromPackageId is required', 400));
  }
  if (toPartnerId === undefined || toPartnerId === null) {
    return next(new ErrorResponse('toPartnerId is required', 400));
  }
  const result = await clonePackageToPartner({ fromPackageId, toPartnerId, overrides });
  return res.status(200).json({
    status: true,
    data: result,
    message: 'Package cloned successfully',
    responseCode: '000',
  });
});

exports.addCashbacksToPackage = asyncHandler(async (req, res, next) => {
  const { toPackageId, sourceCashbackIds } = req.body;
  if (!toPackageId) {
    return next(new ErrorResponse('toPackageId is required', 400));
  }
  if (!Array.isArray(sourceCashbackIds) || sourceCashbackIds.length === 0) {
    return next(new ErrorResponse('sourceCashbackIds must be a non-empty array', 400));
  }
  const result = await addCashbacksToTargetPackage({ toPackageId, sourceCashbackIds });
  return res.status(200).json({
    status: true,
    data: result,
    message: 'Cashbacks added successfully',
    responseCode: '000',
  });
});
