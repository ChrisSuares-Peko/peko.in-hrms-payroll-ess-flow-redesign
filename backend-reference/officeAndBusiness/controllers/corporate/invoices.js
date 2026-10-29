const {
  createInvoice,
  updateInvoice,
  findAllInvoicesAndCount,
  findOneInvoice,
  getInvoiceCount,
  getInvoiceCountByStatus,
  getInvoiceAmountByStatus,
  findInvoiceByInvoiceId,
} = require("../../models/use-cases/invoices");
const { findOneBankAccount } = require("../../models/use-cases/bankDetails");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const emailer = require("../../utils/emailer");
const fs = require("fs");
const { invoicingTemplete } = require("../../utils/invoiceTemplate");
const puppeteer = require('puppeteer');
const { findOneDefaultAddress } = require("../../models/use-cases/addressDetails");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { findOneInvoiceSupplier } = require("../../models/use-cases/invoiceSupplier");
const { shareInvoicePdfTemplate } = require("../../utils/emailTemplates/invoice");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.sendInvoiceToEmail = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;

    const { invoiceId, email } = data;

    if (!invoiceId || !email) {
      return res.status(400).json({
        status: false,
        message: 'Invoice ID or Email not provided',
        data: {},
        responseCode: '001'
      });
    }
    const result = await findOneInvoice({ id: invoiceId, credentialId: req.user.id });
    if (!result) {
      return next(new ErrorResponse("Invoice details not found", 404))
    }

    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const corporateName = req.user.name
    const corporateDetails = {
      companyName: corporateName,
      companyEmail: req.user.email,
      companyMobile: req.user.mobileNo
    }
    // const recipientDetails = JSON.parse(result.recipientDetails)
    const customerName = 'Customer' // we don't need to mention customer name becuase corporate is sharing invoice with some other persons
    const paymentDetails = JSON.parse(result.paymentDetails)
    const invoiceDetails = JSON.parse(result.invoiceDetails)
    const amountDue = paymentDetails.amountDue

    const invoiceHtmlWithStyle = invoicingTemplete(result);
    const random = new Date().valueOf();

    let browser;
    try {
      // Create a browser instance with Puppeteer
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: "new"
      });
      const page = await browser.newPage();

      // Set content to the page
      await page.setContent(invoiceHtmlWithStyle);

      // Generate PDF using Puppeteer
      const outputFile = `Invoice-${random}.pdf`;
      await page.pdf({
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
      });

      const { invoiceNo } = invoiceDetails
      // const subject = `Your Invoice ${invoiceNo} from ${partnerDetails.branding} Business platform`
      const subject = `Your Invoice from ${corporateName} - Invoice #${invoiceNo} `

      // Optional: Send email after PDF generation
      const body = shareInvoicePdfTemplate({ ...invoiceDetails, customerName, amountDue, ...corporateDetails }, partnerDetails);
      emailer.sendEmailWithCorporateName(email, subject, body, corporateName, 'invoice.pdf', outputFile, function () {
        // Optionally, delete temporary files
        try {
          fs.unlinkSync(`Invoice-${random}.pdf`);
        } catch (unlinkError) {
          customLog(req?.LogTraceId, "error", { message: "Error deleting temporary file", data: unlinkError });
        }
        return res.status(200).json({
          status: true,
          message: 'Email sent successfully',
          data: {},
          responseCode: '000'
        });
      });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          customLog(req?.LogTraceId, "error", { message: "Error closing browser", data: closeError });
        }
      }
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: 'Something went wrong while sending email',
      data: {},
      responseCode: '001'
    });
  }
});

exports.getDashboardData = asyncHandler(async (req, res, next) => {
  try {
    const { id: credentialId, corporateId: corporateUserId, role, subCorporateId } = req.user;
    const isSubUser = role === 'CORPORATE_SUB_USER' && subCorporateId;
    const subCorporateUserId = isSubUser ? subCorporateId : undefined;

    const totalInvoiceCount = await getInvoiceCount(credentialId, subCorporateUserId);
    const paidInvoiceCount = await getInvoiceCountByStatus('PAID', credentialId, subCorporateUserId);
    const pendingInvoiceCount = await getInvoiceCountByStatus('PENDING', credentialId, subCorporateUserId);
    const lapsedInvoiceCount = await getInvoiceCountByStatus('EXPIRED', credentialId, subCorporateUserId);
    const paidInvoiceAmount = await getInvoiceAmountByStatus('PAID', credentialId, subCorporateUserId);
    const pendingInvoiceAmount = await getInvoiceAmountByStatus('PENDING', credentialId, subCorporateUserId);
    
    const supplierDetails = await findOneInvoiceSupplier({ corporateUserId })

    const paymentLinkKYB = supplierDetails ? {
      kybStatus: supplierDetails.kybStatus,
      rejectReason: supplierDetails.rejectReason
    } : {
      kybStatus: 'PENDING',
      rejectReason: ''
    };

    res.status(200).json({
      status: true,
      data: {
        totalInvoiceCount:totalInvoiceCount || 0,
        paidInvoiceCount: paidInvoiceCount || 0,
        pendingInvoiceCount: pendingInvoiceCount || 0,
        lapsedInvoiceCount: lapsedInvoiceCount || 0,
        paidInvoiceAmount: paidInvoiceAmount || 0,
        pendingInvoiceAmount: pendingInvoiceAmount || 0,
        paymentLinkKYB: paymentLinkKYB,
      },
      message: "Dashboard data fetched successfully",
      responseCode: "000"
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    next(new ErrorResponse(error.message, 400));
  }
});

exports.getInvoice = asyncHandler(async (req, res, next) => {
  try {
    const result = await findOneInvoice({ id: req.params.id, credentialId: req.user.id });
    if(!result){
      return next(new ErrorResponse(`Something went wrong while fetching invoice data`, 400))
    }else{

      res.status(200).send({
        status: true, 
        data: result,
        message: "Invoice fetched successfully",
        responseCode: "000"
      })
    }
  }catch(error){
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    next(new ErrorResponse(error.message, 400));
  }
})

const uploadAndSetImage = async (params, paramName, folderName, user) => {
  if (params[paramName] && params[paramName] instanceof Object) {
      const { imageBase, imageFormat } = params[paramName];
      const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"
      }/${user?.username ? user?.username : "unknown-user"}/${folderName}`
        const publicUrl = await uploadFile(imageBase, filePath, imageFormat);
        params[paramName]  = publicUrl;
  }
};

exports.createInvoice = asyncHandler(async (req, res, next) => {
  try {
    const total = req.body?.paymentDetails?.amountDue
    const dueDate = req.body?.invoiceDetails?.dueDate
    const user = req.user
    const data = {...req.body,credentialId:req.params.corporateId, dueDate, amount:total};
    data.recipientDetails = JSON.stringify(data.recipientDetails);
    await uploadAndSetImage(data.invoiceDetails, 'logo' ,'invoices', user)
    data.invoiceDetails = JSON.stringify(data.invoiceDetails);
    data.productDetails = JSON.stringify(data.productDetails);
    data.paymentDetails = JSON.stringify(data.paymentDetails);
    data.comments = JSON.stringify(data.comments);
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      data.subCorporateUserId = req.user.subCorporateId;
    }
    let result = await createInvoice(data);
    if (!result) {
      return next(new ErrorResponse(`Something went wrong while adding invoice`, 500));
    } else {
      return res.status(200).json({
        status: true,
        message: "Invoice generated successfully",
        data: result,
        responseCode: '000'
      });
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});

/////////////////will find particular user's invoice////////////////////
exports.findAllInvoicesAndCount = asyncHandler(async (req, res, next) => {
  try {

    let { from, to, searchText, page, itemsPerPage } = req.query;
    let userId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';

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
      from,
      to,
      limit,
      offset,
      searchText,
      sort,
      userId
    }
    
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
    }
    const invoiceData = await findAllInvoicesAndCount(params);
    customLog(req?.LogTraceId, "info", { message: "params in invoice", params })
    if (!invoiceData) {
      return next(new ErrorResponse(`Something went wrong while getting all invoices from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {'invoiceData':invoiceData ? invoiceData.rows : 0,
        'recordsTotal': invoiceData ? invoiceData.count : 0,
        },
        'message': 'All invoices Fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
  try {
    let params = req.params;
    params.credentialId = req.user.id;
    let data = req.body;
    let result = await updateInvoice(params, data);
    if (!result) {
      return next(new ErrorResponse(`Something went wrong while updating status`, 200));
    } else {
      return res.status(200).json({
        status: true,
        message: "Status updated successfully",
        data: {},
        responseCode: '000'
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    next(new ErrorResponse("Something went wrong", 400));
  }
});

exports.findOneBankAccount = asyncHandler(async (req, res) => {
  let params = {corporateId:req.user.id}
  const result = await findOneBankAccount(params);
  if (!result) {
    // Bank account details are not available
    const bankDetails = {
      accountHolderName: "Not available",
      accountNumber: "Not available",
      iban: "Not available",
      bankName: "Not available",
      // Set other properties if needed
    };
    return res.status(200).json({
      status: true,
      data: bankDetails,
      message: 'Fetched Bank Account successfully',
      responseCode: '002'
    });
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: 'Fetched Bank Account successfully',
      responseCode: '000'
    });
  }
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  try {
    const data = req.body;

    const { invoiceId } = data;

    if (invoiceId) {
      const result = await findOneInvoice({ id: invoiceId, credentialId: req.user.id });

      if (!result) {
        return res.status(500).json({
          status: false,
          message: 'Invoice details not found.',
          data: {},
          responseCode: '001'
        });
      }

      const invoiceHtmlWithStyle = invoicingTemplete(result);
      let random = new Date().valueOf();

      // Create a browser instance with Puppeteer
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: "new"
      });
      const page = await browser.newPage();

      // Set content to the page
      await page.setContent(invoiceHtmlWithStyle);

      // Generate PDF using Puppeteer
      const outputFile = `Invoice-${random}.pdf`;
      await page.pdf({
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
      });

      customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

      const pdfBuffer = fs.readFileSync(outputFile);

        browser.close();

        fs.unlinkSync(outputFile);

     return res.status(200).json({
        status: true,
        message: 'PDF generated successfully.',
        data: {
          pdfBuffer,
        },
        responseCode: '000'
      });

    
    } else {
      return res.status(400).json({
        status: false,
        message: 'Invoice ID not provided',
        data: {},
        responseCode: '001'
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: 'Error generating PDF',
      data: {},
      responseCode: '001'
    });
  }
})

exports.findCorporateDetails = asyncHandler(async (req, res) => {
  let params = {
    credentialId: req.user.id,
    default: true,
  };
  let result = await findOneDefaultAddress(params);
  console.log(req.user);

  if (!result) {
    let data = {
      addressId: "",
      addressLine1: "",
      addressLine2: "",
      userName: req.user.name,
      userEmail: req.user.email,
      userCountry: req.user.country,
      mobileNo: req.user.mobile,
      logo: req.user.logo,
    };
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: data,
      responseCode: "002",
    });
  } else {
    let data = {
      addressId: result.id,
      addressLine1: result.addressLine1,
      addressLine2: result.addressLine2,
      userName: req.user.name,
      userEmail: req.user.email,
      userCountry: req.user.country,
      mobileNo: req.user.mobile,
      logo: req.user.logo,
    };
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: data,
      responseCode: "000",
    });
  }
});

exports.isInvoiceIdAvailabe = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.params
  const isInvoiceIdExists = await findInvoiceByInvoiceId(req.user.id, invoiceId, ['id'])
  if (isInvoiceIdExists) {
    return next(new ErrorResponse('Invoice ID already exists', 400))
  }
  return res.status(200).json({
    status: true,
    message: "Invoice ID is available",
    data: {},
    responseCode: '000'
  });
})