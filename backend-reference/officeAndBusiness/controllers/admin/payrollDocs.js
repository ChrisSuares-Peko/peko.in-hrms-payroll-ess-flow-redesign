const {
  findAllDocumentsCount,
  create,
  update,
  Delete,
  getExcelCSVData,
  findOne,
  fetchAllCategories,
  documentsAndCountExport,
} = require("../../models/use-cases/payrollDocs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const puppeteer = require("puppeteer");
const fs = require("fs");

exports.findAllDocumentsAndCount = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
  let searchText = req.query.searchText || '';
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'createdAt'
  let params = {
    page,
    itemsPerPage,
    searchText,
    sort,
    sortField
  };

  try {
    const documentData = await findAllDocumentsCount(params);
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: documentData.count,
        data: documentData.rows
      },
      message: 'Documents Fetched Successfully',
      responseCode: '000'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
      data: {},
      responseCode: '001'
    });
  }
});

exports.documentsAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  let searchText = req.query.search || '';
  const {type} = req.params;
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'createdAt'
  let params = {
    searchText,
    sort,
    sortField
  };

  try {
    const data = await documentsAndCountExport(params);
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: `Something went wrong while generating report`,
      data: {},
      responseCode: '001'
    });
  }
});

exports.documentsAndCountPDF = asyncHandler(async (req, res, next) => {
  let searchText = req.query.search || '';
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'createdAt'
  let params = {
    searchText,
    sort,
    sortField
  };

  try {
    const data = await documentsAndCountExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
    }
    
    const templateDetails = {
      title: 'E-Docs'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
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
        scale: 0.6,
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: `Something went wrong while generating report`,
      data: {},
      responseCode: '001'
    });
  }
});

exports.createDocumentEntry = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const isExists = await findOne(data);
  if (isExists) {
    return next(new ErrorResponse(`Document already exists`, 403));
  }
  let result = await create(data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while adding the document`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Document uploaded successfully",
      responseCode: "000",
    });
  }
});

exports.updateDocument = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const isExists = await findOne(data);
  if (isExists && isExists.id != params.id) {
    return next(new ErrorResponse(`Document already exists`, 403));
  }
  const result = await update(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating the document`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {},
      message: "Document updated successfully",
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
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.deleteDocument = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await Delete(params);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while deleting the document`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Document deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.fetchAllCategories = asyncHandler(async (req, res, next) => {
  const categoryData = await fetchAllCategories();
  if (!categoryData) {
    return next(
      new ErrorResponse(`Something went wrong while fetching categories`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: { categoryData },
      message: "Categories fetched successfully",
      responseCode: "000",
    });
  }
});

exports.getExcel = asyncHandler(async (req, res, next) => {
  let result = await getExcelCSVData();
  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while fetching excel/CSV data`,
        200
      )
    );
  } else {
    return res.status(200).json({
      success: true,
      data: result,
      responseCode: "000",
      message: "Excel sheet fetched successfully",
    });
  }
});
