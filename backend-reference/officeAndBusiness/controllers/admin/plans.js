const {
  create,
  updatePlan,
  deletePlan,
  findAllPlans,
  findOne,
  findAllPlansAndCount,
  fetchPlans,
  plansAndCountExport,
} = require("../../models/use-cases/plans");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { removeCommissionFields } = require("../../utils/configuredFlag");
const puppeteer = require("puppeteer");
const fs = require("fs");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
exports.createPlan = asyncHandler(async (req, res, next) => {
  const data = req.body
  let isPlanAvailable = await findOne(data.name)
  if (isPlanAvailable) {
    return next(new ErrorResponse(`Plan name already exists`, 403))
  }
  let result = await create(data)
  if (!result) {
  return next(new ErrorResponse(`Something went wrong while adding plan`, 500))
  } else {
    return res.status(200).json({
          'status': true,
          'message': 'Plan created successfully',
          'data': result ,
          'responseCode' : '000'
      })
  }
})

exports.findAllPlansAndCount = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
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
    isAdmin: true,
  };
  const planData = await findAllPlansAndCount(params);
  if (!planData) {
    return next(
      new ErrorResponse(
        `Something went wrong while getting all plans from database`,
        400
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: planData ? planData.count : 0,
        recordsFiltered: planData ? planData.count : 0,
        data: planData ? planData.rows : 0,
      },
      message: "Records fetched successfully",
      responseCode: "000",
    });
  }
});

exports.updatePlan = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let isPlanAvailable = await findOne(data.name);
  if (isPlanAvailable && isPlanAvailable.id != params.id) {
    return next(new ErrorResponse(`Plan name already exists`, 403));
  }
  const result = await updatePlan(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating the Plan`, 400)
    );
  } else {
    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      responseCode: "000",
      data: {},
    });
  }
});

exports.plansAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;
  const { type } = req.params;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await plansAndCountExport(params);
  if (!data) {
    return next(
      new ErrorResponse(`Something went wrong while generating report`, 500)
    );
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

exports.plansAndCountPDF = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await plansAndCountExport(params);
  if (!data) {
    return next(
      new ErrorResponse(`Something went wrong while generating report`, 400)
    );
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }

  const templateDetails = {
    title: "Office Address",
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
    scale: 0.7,
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

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await updatePlan(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 400)
    );
  } else {
    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.deletePlan = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await deletePlan(params);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while deleting the plan`, 400)
    );
  } else {
    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
      responseCode: "000",
      data: {},
    });
  }
});

exports.findAllPlans = async (req, res, next) => {
  try {
    const result = await findAllPlans(req.user?.id);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while fetching plans`, 400)
      );
    } else {
      removeCommissionFields(result);
      return res.status(200).json({
        status: true,
        data: { data: result },
        message: "Fetched all plans successfull",
        responseCode: "000",
      });
    }
  } catch (e) {
    console.log("🚀 ~ exports.findAllPlans= ~ e:", e.message);
    return next(
      new ErrorResponse(`Something went wrong while fetching plans`, 500)
    );
  }
};

exports.fetchPlans = asyncHandler(async (req, res, next) => {
  let searchText = req.query.q;
  let result = await fetchPlans(searchText);
  console.log("fetch plans results in controller", result);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching plans`, 400)
    );
  } else {
    return res.status(200).json({
      success: true,
      data: result,
      message: "Successfully fetched the plans",
      responseCode: "000",
    });
  }
});
