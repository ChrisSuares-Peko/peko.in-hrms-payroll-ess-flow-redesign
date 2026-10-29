const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { findAllTransactions, businessEmailOrdersExcelCSVData } = require("../../models/use-cases/transaction");
const { create, findAll, findOne, update, listAll, productAndCountExport, Delete } = require("../../models/use-cases/softwares_subscriptions");
const { fetchVendorDetails } = require("../../models/use-cases/vendors");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { SoftwareSubscriptionPlansCount } = require("../../models/use-cases/softwares_subscriptions_plans");
const { customLog } = require("../../utils/loggerHelper");

exports.createSoftwareSubscription = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const existingSubscription = await findOne({ peko_key: data.peko_key });
  if (existingSubscription) {
    return next(new ErrorResponse(`Duplicate peko key is not allowed`, 400));
  }
  let result = await create(data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding Email or Domain`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Email or Domain added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllSoftwareSubscriptionsAndCount = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    limit,
    offset,
    searchText,
    sort,
    sortField,
  };

  const status = false; // false will give you whole list and true will give only active software subscriptions
  const productData = await findAll(params, status);
  if (!productData) {
    return next(new ErrorResponse(`Something went wrong while getting all Email or Domain`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: productData ? productData.count : 0,
        recordsFiltered: productData ? productData.count : 0,
        data: productData ? productData.rows : 0,
      },
      message: "Email or Domain fetched successfully",
      responseCode: "000",
    });
  }
});

exports.fetchSoftwareSubscriptionVendor = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  const type = "emailOrDomain";
  let result = await fetchVendorDetails(searchText, type);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: { result },
      message: "Vendor fetched successfully",
      responseCode: "000",
    });
  }
});

exports.updateSoftwareSubscription = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const existingSubscription = await findOne({ peko_key: data.peko_key });
  if (existingSubscription && existingSubscription.id != params.id) {
    return next(new ErrorResponse(`Peko key already exists`, 403));
  }
  const result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the Email or Domain`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Email or Domain updated successfully",
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
    return next(new ErrorResponse(`Something went wrong while updating status`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.listAllSoftwareSubscriptionsAndCount = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;

  let params = {
    searchText,
  };

  const status = true;
  const attributes = ["id", "name"];
  const productData = await listAll(params, status, attributes);
  if (!productData) {
    return next(new ErrorResponse(`Something went wrong while getting all Email or Domains`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: productData ? productData.count : 0,
        recordsFiltered: productData ? productData.count : 0,
        data: productData ? productData.rows : 0,
      },
      message: "Email or Domains fetched successfully",
      responseCode: "000",
    });
  }
});

exports.softwareSubscriptionAndCountPDF = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await productAndCountExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 400));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }

  const templateDetails = {
    title: "Business Emails",
  };
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
    scale: 0.6,
    path: outputFile,
    format: "A4",
    preferCSSPageSize: true,
  });

  console.log("PDF generated successfully!");

  const buffer = fs.readFileSync(outputFile);

  browser.close();

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
});

exports.softwareSubscriptionAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;
  let { type } = req.params;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await productAndCountExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500));
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
      status: true,
      data: { buffer, fileType },
      message: "Fetched excel/csv datas successfully",
      responseCode: "000",
    });
  }
});

exports.deleteSoftwareSubscription = async (req, res) => {
  const productCode = req.params.id;
  try {
    const plansCount = await SoftwareSubscriptionPlansCount({
      productCode,
    });
    if (plansCount > 0) {
      return res.status(400).json({
        status: false,
        data: {},
        message: "Cannot delete Email or Domain. Plans are associated with it.",
        responseCode: "001",
      });
    }
    const result = await Delete({
      productCode,
    });
    if (result === 1) {
      return res.status(200).json({
        status: true,
        message: "Email or Domain deleted successfully",
        data: {},
        responseCode: "000",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "An error occured while deleting the Email or Domain.",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "🚀 ~ exports.deleteSoftwareSubscription ~ error:" + error })
    return res.status(500).json({
      status: false,
      message: "An error occured while deleting the Email or Domain.",
      data: {},
      responseCode: "001",
    });
  }
};


exports.findAllBusinessEmailsOrdersAndCount = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage, status } = req.query;
  let corporateId = req.query.corporateId || undefined
  let registeredBy = req.user.registeredBy
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'id'

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage
  let categoryName = "Business Emails";
  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    from,
    to,
    searchText,
    sort,
    limit,
    offset,
    corporateId,
    sortField,
    registeredBy,
    status,
    categoryName
  }

  const businessEmailData = await findAllTransactions(params);
  if (!businessEmailData) {
    return next(new ErrorResponse(`Something went wrong while getting business email orders`, 500))
  } else {
    return res.status(201).json({
      'status': true,
      'data': {
        'recordsTotal': businessEmailData.count,
        'data': businessEmailData.rows
      },
      'message': 'Business email orders fetched successfully',
      'responseCode': '000'

    })
  }
})

exports.businessEmailOrdersGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, status } = req.query;
  let corporateId = req.query.corporateId || undefined
  let registeredBy = req.user.registeredBy
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'id'
  const { type } = req.params;
  let categoryName = "Business Emails";
  let params = {
    from,
    to,
    searchText,
    sort,
    corporateId,
    sortField,
    registeredBy,
    status,
    categoryName
  }
  const data = await businessEmailOrdersExcelCSVData(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type)
    return res.status(200).json({
      'status': true,
      'data': { buffer, fileType },
      'message': 'Fetched excel/csv datas successfully',
      'responseCode': '000'
    })
  }
})
exports.businessEmailOrdersGeneratePDF = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, status } = req.query;
  let corporateId = req.query.corporateId || undefined
  let registeredBy = req.user.registeredBy
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'id'
  let categoryName = "Business Emails";

  let params = {
    from,
    to,
    searchText,
    sort,
    corporateId,
    sortField,
    registeredBy,
    status,
    categoryName
  }
  const data = await businessEmailOrdersExcelCSVData(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
    title: 'Business Emails'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
    scale: 0.8,
    path: outputFile,
    format: 'A4',
    preferCSSPageSize: true
  });

  console.log('PDF generated successfully!');

  const buffer = fs.readFileSync(outputFile);

  browser.close();

  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: 'report generated successfully.',
    data: {
      buffer,
      fileType: 'application/pdf'
    },
    responseCode: '000'
  });
})