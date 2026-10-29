
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { processInvoice } = require('../../services/ocr');
const {
//   fetchServiceDetails,
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");
const { customLog } = require("../../utils/loggerHelper");
const accessKey = "dviz_technologies";

// Helper function to extract items and match them
function generateInvoiceItems(data) {
  const items = [];
  const matchedSet = new Set(); // To keep track of matched items and prevent duplicates
  const names = data.filter(e => e.item_name).map(e => e.item_name);
  const qtys = data.filter(e => e.item_qty).map(e => e.item_qty);
  const values = data.filter(e => e.item_value).map(e => e.item_value);

  // Iterate and match items based on index without duplicates
  for (let i = 0; i < Math.min(names.length, qtys.length, values.length); i++) {
    const itemName = names[i];
    const itemQty = qtys[i];
    const itemValue = values[i];

    const matchKey = `${itemName}-${itemQty}-${itemValue}`;
    if (!matchedSet.has(matchKey)) {
      // Add to matched set to avoid duplicates
      matchedSet.add(matchKey);
      items.push({
        item: itemName,
        quantity: itemQty,
        price: itemValue
      });
    }
  }
  return items;
}

// for invoice upload
exports.uploadInvoiceAndFetchData = asyncHandler(async (req, res, next) => {
  
  if (!req.file) {
    return next(new ErrorResponse("Invoice file is required", 400));
  }
  try {

    const data = req?.file;

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 402));
    }

    const { status, data: invoiceData } = await processInvoice(serviceDetails?.vendor, data);

    if (!status) {
      return next(new ErrorResponse("Something went wrong while processing the invoice.", 500));
    }

    let optimizedData = {};

    // Use Object.entries for clarity and to avoid mutation issues
    Object.entries(invoiceData.entities).forEach((item) => {
      for (let itemKey in item) {
        // Correctly handle invoice items separately
        if (itemKey !== "item_qty" && itemKey !== "item_name" && itemKey !== "item_value") {
          optimizedData[itemKey] = item[itemKey];
        }
      }
    });

    const invoiceItems = generateInvoiceItems(invoiceData.entities);

    optimizedData.invoiceItems = invoiceItems;

    return res.status(200).json({
      status: true,
      message: "Invoice processed successfully",
      responseCode: '000',
      data: {
        invoiceData: optimizedData,
        filename: invoiceData.filename
      }
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong while processing the invoice.", 500));
  }
});

// Invoice Processing  vendor payout
exports.processInvoice = asyncHandler(async (req, res, next) => {

  if (!req.file) {
    return next(new ErrorResponse("Invoice file is required", 400));
  }
  try {

    const data = req?.file;

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 402));
    }

    const { status, message, data: invoiceData } = await processInvoice(serviceDetails?.vendor, data);

    if (!status) return next(new ErrorResponse(message, 402));

    return res.status(200).json({
      status: true,
      message: "Invoice processed successfully",
      responseCode: '000',
      data: invoiceData
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong while processing the invoice.", 500));
  }
});
