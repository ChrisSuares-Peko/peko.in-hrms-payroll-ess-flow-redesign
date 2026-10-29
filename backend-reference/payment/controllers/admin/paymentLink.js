const asyncHandler = require("../../middlewares/async");
const {
  findAllPaymentLinksByAdmin,
  paymentLinksExport,
} = require("../../models/use-cases/paymentLink");
const { generatePaymentLinkTemplate } = require("../../utils/emailTemplate/paymentLink");
const ErrorResponse = require("../../utils/error-response");
const emailer = require("../../utils/emailer");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const fs = require("fs");
const puppeteer = require('puppeteer');

exports.findAllPaymentLinksAndCount = asyncHandler(async (req, res, next) => {
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
     let from = req.query.from;
    let to = req.query.to;
    let params = {
      limit,
      offset,
      searchText,
      sort,
      sortField,
      from,
      to
    };
    const paymentLinksData = await findAllPaymentLinksByAdmin(params);
    if (!paymentLinksData) {
      return next(
        new ErrorResponse(
          `Something went wrong while fetching payment links from the database`,
          400
        )
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {
          recordsTotal: paymentLinksData.count,
          data: paymentLinksData.rows,
        },
        message: "Find all links successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    console.log(
      "🚀 ~ exports.findAllPaymentLinksAndCount=asyncHandler ~ error:",
      error
    );
    return next(
      new ErrorResponse(
        "Something went wrong while fetching payment links from the database",
        400
      )
    );
  }
});

exports.sendMail = asyncHandler(async (req, res) => {
  try {
    const { email, amount, link, contactPerson } = req.body;

    if (email) {
      let partnerData;
      req.user.registeredBy ? (partnerData = await fetchPartnerDetails(req.user.registeredBy)) : (partnerData = await partnerLogos());
      const subject = "Payment link";
      const resolvedPaymentLink = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.PAYMENT_LINK_GENERATED,
        service: EMAIL_TEMPLATE_SERVICES.PAYMENT_LINK,
        variables: {
          amount,
          link,
          contactPerson: contactPerson || "User",
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => generatePaymentLinkTemplate(amount, link, contactPerson),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(email, resolvedPaymentLink.subject, resolvedPaymentLink.html, function (err) {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Error sending email",
            data: {},
            responseCode: "001",
          });
        }
        return res.status(200).json({
          status: true,
          message: "Email sent successfully",
          data: {},
          responseCode: "000",
        });
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Email not provided",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Error sending email",
      data: {},
      responseCode: "001",
    });
  }
});

exports.paymentLinksExcelCSV = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let from = req.query.from;
    let to = req.query.to;

    let params = {
        searchText,
        sort,
        sortField,
        from,
        to
    };

    const data = await paymentLinksExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type)
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }

});

exports.paymentLinksPDF = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let from = req.query.from;
    let to = req.query.to;
    let params = {
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const data = await paymentLinksExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    }

    const templateDetails = {
        title: 'Payment Link'
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
        scale: 0.2,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });

   

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

});