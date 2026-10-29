const asyncHandler = require("../../middlewares/async");
const { fetchVendorDetails } = require("../../models/use-cases/vendors");
const {
  create,
  update,
  fetchAllWorks,
  findAllAvailableWorks,
  Delete,
  worksExport,
} = require("../../models/use-cases/works");
const { findOnePlanWithWorkId } = require("../../models/use-cases/works_plan");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require("puppeteer");
const fs = require("fs");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.createWorks = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    if (req.body.credentialId === 'default') {
      req.body.credentialId = null;
  }
    const result = await create(data);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while adding works`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: result,
        message: "Works added successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateWorks = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    let params = req.params;
    if (req.body.credentialId === 'default') {
      req.body.credentialId = null;
  }
    const result = await update(data, params);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while updating works`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { result },
        message: "Works updated successfully",
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

exports.updateWorksStatus = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    let params = req.params;
    const result = await update(data, params);
    if (!result) {
      return next(
        new ErrorResponse(
          `Something went wrong while updating work status`,
          500
        )
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { result },
        message: "Work status updated successfully",
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

exports.findAllWorks = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage, partnerId } = req.query;

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
    from,
    to,
    searchText,
    sort,
    limit,
    offset,
    sortField,
    partnerId
  };

  const works = await fetchAllWorks(params);

  if (!works) {
    return next(
      new ErrorResponse(`Something went wrong while getting works`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Works fetched successfully",
      data: works,
      responseCode: "000",
    });
  }
});

exports.worksExcelCSV = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  const { type } = req.params;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
  };

  const data = await worksExport(params);

  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})

exports.worksPDF = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
  };

  const data = await worksExport(params);

  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  
  const templateDetails = {
      title: 'Peko Works'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
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
    path: outputFile,
    scale: 0.6,
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

exports.fetchWorksVendor = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  const type = "pekoWorks";
  let result = await fetchVendorDetails(searchText, type);
  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while fetching specific vendor`,
        500
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      data: { result },
      message: "Vendor fetched successfully",
      responseCode: "000",
    });
  }
});

exports.findAllAvailableWorks = asyncHandler(async (req, res, next) => {
  try {
      let searchText = req.query.searchText
      const result = await findAllAvailableWorks(searchText);
      if (!result) {
          return next(new ErrorResponse(`Something went wrong while getting works`, 500))
      } else {
          return res.status(200).json({
              'status': true,
              'data': {result} ,
              'message': 'Works fetched successfully',
              'responseCode': '000'
          })
      }
  } catch (error) {
      return res.status(500).json({
          status: false,
          message: "Something went wrong",
          data: {},
          responseCode: '001'
      })
  }
})

exports.deleteWork = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let planExist = await findOnePlanWithWorkId(params);
  if (planExist) {
    return next(
      new ErrorResponse(
        `Work cannot be deleted because it is assigned to a plan.`,
        400
      )
    );
  }
  const result = await Delete(params);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while deleting the work`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Work deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});
