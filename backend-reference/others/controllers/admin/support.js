const {
  update,
  create,
  findAllMessage,
  getExcel,
  allMessages,
  findAllChats,
  createChatMessage,
  findOneTicket,
  fetchReportData,
} = require("../../models/use-cases/support");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const { default: puppeteer } = require('puppeteer')
const fs = require('fs');
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");

exports.createMessage = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const user = req.user
  let result = await create(data,user);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding message`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Ticket created successfully",
      responseCode: "000",
    });
  }
});

exports.findAllMessageAndCount = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  let { from, to, searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let column = "createdAt";

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }
  const registeredBy=req.user.registeredBy
  let params = { from, to, limit, offset, searchText, sort, column,status, registeredBy };
  const MessageData = await findAllMessage(params);
  if (!MessageData) {
    return next(new ErrorResponse(`Something went wrong while fetching message`, 500));
  } else {
    res.json({
      status: true,
      data: {
        recordsTotal: MessageData.count,
        recordsFiltered: MessageData.count,
        data: MessageData.rows,
      },
      message: "Tickets fetched successfully",
      responseCode: "000",
    });
  }
});

exports.allMessages = async (req, res) => {
  try {
    // const data = req.body
    let result = await allMessages(req);
    res.send(result);
  } catch (e) {
    res.send(e.message);
  }
};

exports.updateMessage = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let user = req.user
  const result = await update(params, data,user);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating message`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Ticket status updated successfully",
      data: { result },
      responseCode: "000",
    });
  }
});

exports.getExcel = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate;
  const to = req.query.toDate;
  let order = req.query.orderCol,
    column = req.query.column;
  let status = req.query.status;
  let params = { from, to, order, column, status };
  let result = await getExcel(params);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating message`, 200));
  } else {
    return res.status(200).json({
      success: true,
      data: result,
    });
  }
});

//create chat
exports.createChatMessage = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    const result = await createChatMessage(data);

    if (!result) {
      return next(new ErrorResponse(`Something went wrong while adding the message`, 200));
    } else {
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error("Error creating message:", error);
    next(error);
  }
});

//get chat
exports.getAllChatMessage = asyncHandler(async (req, res, next) => {
  try {
    const id = req.params.id;

    const result = await findAllChats(id);

    if (!result) {
      return next(new ErrorResponse(`Something went wrong while adding the message`, 200));
    } else {
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error("Error creating message:", error);
    next(error);
  }
});

exports.fetchTicketDetails = asyncHandler(async (req, res, next) => {
  let params = req.params;

  const result = await findOneTicket(params);
  if (result) {
    return res.status(200).json({
      status: true,
      message: "Fetched tickets details successfully",
      data: result,
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(`No tickets found`, 500));
  }
});


exports.downloadReportExcelCSV = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, status } = req.query;

  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || "createdAt";
  searchText = searchText || ""

  const { type } = req.params

  const registeredBy = req.user.registeredBy
  // const partnerId = 1;

  let params = { from, to, searchText, sort, sortField, status, registeredBy }

  const reportData = await fetchReportData(params);
  if(!reportData) {
      return next(new ErrorResponse('Something went wrong while fetching report', 500))
  } 
  else if (reportData.length == 0) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  
  const {buffer, fileType} = await generateExcelBufferAndType(reportData, type)
  return res.status(200).json({
      'status': true,
      'data': {buffer, fileType},
      'message': 'Fetched excel/csv datas successfully',
      'responseCode': '000'
  })
})

exports.downloadReportPDF = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, status } = req.query;
console.log(req.query)
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || "createdAt";
  searchText = searchText || ""

  const registeredBy = req.user.registeredBy
  // const partnerId = 1;

  let params = { from, to, searchText, sort, sortField, status, registeredBy }

  const reportData = await fetchReportData(params);
  if(!reportData) {
      return next(new ErrorResponse('Something went wrong while fetching report', 500))
  } 
  else if (reportData.length == 0) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }

  const reportHtmlWithStyle = reportPdfTemplate(reportData);
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