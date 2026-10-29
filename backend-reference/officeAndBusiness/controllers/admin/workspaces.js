const {
  create,
  updateWorkspace,
  deleteWorkspace,
  findAllWorkspacesAndCount,
  workspacesAndCountExport,
} = require("../../models/use-cases/workspaces");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const fs = require("fs");
const puppeteer = require("puppeteer");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
exports.createWorkspaces = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let result = await create(data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while adding workspace`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "workspace added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllWorkspacesAndCount = asyncHandler(async (req, res, next) => {
  try {
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
    };
    const workspacesData = await findAllWorkspacesAndCount(params);
    if (!workspacesData) {
      return next(new ErrorResponse(`Something went wrong while getting all workspaces from database`, 400));
    } else {
      return res.status(200).json({
        status: true,
        data: {
          recordsTotal: workspacesData ? workspacesData.count : 0,
          data: workspacesData ? workspacesData.rows : 0,
        },
        message: "Workspace Datas Fetched Successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: true,
      data: {},
      message: error.message,
      responseCode: '001'
    })
  }
});

exports.workspacesAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  try {
    let { searchText } = req.query;
    let { type } = req.params;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";
    let params = {
      searchText,
      sort,
      sortField,
    };
    const data = await workspacesAndCountExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
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
  } catch (error) {
    return res.status(500).json({
      status: true,
      data: {},
      message: `Something went wrong while generating report`,
      responseCode: "001",
    });
  }
});

exports.workspacesAndCountPDF = asyncHandler(async (req, res, next) => {
  try {
    let { searchText } = req.query;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";
    let params = {
      searchText,
      sort,
      sortField,
    };
    const data = await workspacesAndCountExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500));
    }

    const templateDetails = {
      title: "Workspaces",
    };
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, {
      waitUntil: "domcontentloaded",
    });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
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
  } catch (error) {
    return res.status(500).json({
      status: true,
      data: {},
      message: `Something went wrong while generating report`,
      responseCode: "001",
    });
  }
});

exports.updateWorkspace = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const result = await updateWorkspace(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating workspace`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {},
      message: "workspace updated successfully",
      responseCode: "000",
    });
  }
});

exports.deleteWorkspace = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await deleteWorkspace(params);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while deleting `, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Workspace deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await updateWorkspace(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 500)
    );
  } else {
    return res.status(200).json({
      success: true,
      message: "status updated successfully",
      data: "Updated successfully",
      responseCode: "000",
    });
  }
});
