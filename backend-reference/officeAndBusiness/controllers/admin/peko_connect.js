const {
  update,
  create,
  findAllPeko,
  deleteEntry,
  pekoAndCountExport,
} = require("../../models/use-cases/peko_connect");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");

exports.createPeko = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let result = await create(data);
  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while adding service provider`,
        400
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Service provider added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllPekoAndCount = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      page,
      itemsPerPage,
      searchText,
      sort,
      sortField
    };
    const connectData = await findAllPeko(params);
    if (!connectData) {
      return next(new ErrorResponse(`Something went wrong while getting all service providers from database`, 500))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'recordsTotal': connectData ? connectData.count : 0,
          'data': connectData ? connectData.rows : 0
        },
        'message': 'Fetched all data successfully',
        'responseCode': '000'

      })
    }

  } catch (error) {
    return res.status(500).json({
      'status': 'false',
      'data': {},
      'message': error.message,
      'responseCode': '001'
    })
  }
});

exports.pekoAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  try {
    const { type } = req.params;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      searchText,
      sort,
      sortField
    }
    const data = await pekoAndCountExport(params);
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

  } catch (error) {
    return res.status(500).json({
      'status': 'false',
      'data': {},
      'message': `Something went wrong while generating report`,
      'responseCode': '001'
    })
  }
});

exports.pekoAndCountPDF = asyncHandler(async (req, res, next) => {
  try {
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      searchText,
      sort,
      sortField
    }
    const data = await pekoAndCountExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
      title: 'Connect'
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
      path: outputFile,
      scale: 0.6,
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

  } catch (error) {
    return res.status(500).json({
      'status': 'false',
      'data': {},
      'message': `Something went wrong while generating report`,
      'responseCode': '001'
    })
  }
});

exports.updatePeko = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const result = await update(params, data);
  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while updating service provider`,
        400
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {},
      message: "Service provider updated successfully",
      responseCode: "000",
    });
  }
});

exports.deletePeko = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await deleteEntry(params);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while deleting `, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Service provider deleted successfully",
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
      new ErrorResponse(`Something went wrong while updating status`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});
