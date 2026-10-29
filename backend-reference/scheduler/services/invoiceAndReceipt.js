const {
  findOne: findCorporateUser,
} = require("../models/use-cases/corporateUser");
const { updateOrderInvoiceDetails } = require("../models/use-cases/order");
const { getGstDetails } = require("../models/use-cases/setting");
const {
  generatePekoInvoiceId,
  generatePekoReceiptId,
} = require("../utils/generatePekoInvoiceId");
const {
  taxInvoiceTemplate,
  paymentReceiptTemplate,
  PEKO_COMPANY_DETAILS,
} = require("../utils/invoiceTemplate");
const { resolveStateCode, getStateName } = require("../utils/gstStateCodes");
const { customLog } = require("../utils/loggerHelper");
const { calculateAmountAndTax } = require("./GSTandTAXcalculation");
const fs = require("fs");
const { amountPrecision } = require("../utils/formatter");
const emailer = require("../utils/emailer");
const { vendorInvoiceEmail } = require("../utils/emailTemplates");

// BLOCKER (deliberate): puppeteer is not yet a scheduler dependency. Guarded
// require so the cron service still boots — PDF rendering degrades to "no
// attachment" until `puppeteer` is added to scheduler/package.json.
let puppeteer = null;
try {
  // eslint-disable-next-line global-require
  puppeteer = require("puppeteer");
} catch (requireError) {
  customLog(null, "error", {
    message:
      "puppeteer is not installed in the scheduler service — invoice/receipt PDFs will be skipped",
    error: requireError?.message,
  });
}

const generateInvoiceAndReceipt = async ({
  itemsList = [],
  amount,
  surcharge = 0,
  couponDiscount = 0,
  corporateTxnId,
  orderId,
  paymentType = "Other",
  credentialId,
  pgAmount,
  sendInvoiceToVendor = false,
  commissionIncludingGST = 0,
  vendor,
  // eslint-disable-next-line no-unused-vars
  paymentMethod, // TODO(peko-in): card-level label once the gateway confirms card metadata
}) => {
  try {
    const gstSetting = await getGstDetails();
    const gstRate = parseFloat(gstSetting?.details?.gst);
    if (!gstSetting || isNaN(gstRate)) {
      customLog(null, "error", {
        message: "GST rate not found",
        data: gstSetting,
      });
      return { success: false, message: "GST rate not found" };
    }
    const corporateInfo = await findCorporateUser({ id: credentialId }, [
      "name",
      "mobileNo",
      "gstNumber",
      "state",
      "city",
      "country",
    ]);
    if (!corporateInfo) {
      customLog(null, "error", {
        message: "Corporate user not found",
        data: corporateInfo,
      });
      return { success: false, message: "Corporate user not found" };
    }

    const appliedCouponDiscount = parseFloat(couponDiscount) || 0;

    const gstRateDecimal = gstRate / 100;
    let lineItems = [];
    if (itemsList.length > 0) {
      lineItems = [...itemsList];
    }
    if (surcharge && surcharge > 0) {
      const surchargeTaxDetails = calculateAmountAndTax(
        surcharge,
        gstRateDecimal
      );
      lineItems.push({
        description: `Platform Fee (${paymentType})`,
        quantity: 1,
        price: surchargeTaxDetails?.actualAmount,
        taxableAmount: surchargeTaxDetails?.actualAmount,
        vat: surchargeTaxDetails?.taxAmount,
        lineTotal: surcharge,
      });
    }

    // Place of supply — recipient state resolved from GSTIN prefix, else the
    // free-text state name. Business rule: when the corporate's state is not
    // available (or either side is unresolvable), default to intra-state
    // CGST + SGST rather than IGST.
    const sellerStateCode = resolveStateCode({
      gstNumber: PEKO_COMPANY_DETAILS.gstin,
    });
    const buyerStateCode = resolveStateCode({
      gstNumber: corporateInfo?.gstNumber,
      stateName: corporateInfo?.state,
    });
    const isInterState = Boolean(
      sellerStateCode && buyerStateCode && sellerStateCode !== buyerStateCode
    );
    const placeOfSupplyCode = buyerStateCode || sellerStateCode;
    const placeOfSupply = placeOfSupplyCode
      ? `${getStateName(placeOfSupplyCode)} (${placeOfSupplyCode})`
      : "";

    let vendorInvoiceData = {};
    if (sendInvoiceToVendor && parseFloat(commissionIncludingGST) > 0) {
      const commissionTaxDetails = calculateAmountAndTax(
        parseFloat(commissionIncludingGST),
        gstRateDecimal
      );
      const vendorStateCode = resolveStateCode({
        gstNumber: vendor?.gstNo,
        stateName: vendor?.state,
      });
      const vendorIsInterState = Boolean(
        sellerStateCode && vendorStateCode && sellerStateCode !== vendorStateCode
      );
      const vendorPlaceCode = vendorStateCode || sellerStateCode;
      const vendorTaxLines = vendorIsInterState
        ? [
            {
              label: `IGST (${gstRate}%)`,
              amount: amountPrecision(commissionTaxDetails?.taxAmount),
            },
          ]
        : [
            {
              label: `CGST (${gstRate / 2}%)`,
              amount: amountPrecision(commissionTaxDetails?.taxAmount / 2),
            },
            {
              label: `SGST (${gstRate / 2}%)`,
              amount: amountPrecision(commissionTaxDetails?.taxAmount / 2),
            },
          ];
      const vendorInvoiceId = await generatePekoInvoiceId();
      vendorInvoiceData = {
        billedTo: {
          companyName: vendor?.vendorName,
          address: vendor?.address || "",
          cityCountry: vendor?.state || "",
          gstin: vendor?.gstNo,
        },
        dueDate: new Date().toISOString().split("T")[0],
        invoiceNumber: vendorInvoiceId,
        issuedDate: new Date().toISOString().split("T")[0],
        placeOfSupply: vendorPlaceCode
          ? `${getStateName(vendorPlaceCode)} (${vendorPlaceCode})`
          : "",
        items: [
          {
            description: `Commission (${paymentType})`,
            quantity: 1,
            price: commissionTaxDetails?.actualAmount,
            taxableAmount: commissionTaxDetails?.actualAmount,
            vat: commissionTaxDetails?.taxAmount,
            lineTotal: parseFloat(commissionIncludingGST),
          },
        ],
        subtotal: commissionTaxDetails?.actualAmount,
        taxLines: vendorTaxLines,
        total: parseFloat(commissionIncludingGST),
        note: "Thank you for your service",
      };
    }

    const pekoInvoiceId = await generatePekoInvoiceId();
    const pekoReceiptId = await generatePekoReceiptId();

    const totalAmountPaid =
      parseFloat(amount) + parseFloat(surcharge) - appliedCouponDiscount;
    // Payment mode — 3 cases: WALLET only / PG+WALLET / PG only.
    // TODO(peko-in): once the payment gateway confirms it returns card metadata,
    // derive a card label (scheme + masked PAN) from `paymentMethod`.
    let paymentMode = "Wallet";
    if (pgAmount) {
      const cardLabel = "Payment Gateway";
      const totalAmount = parseFloat(amount || 0) + parseFloat(surcharge || 0);
      const pgAndCouponTotal =
        parseFloat(pgAmount || 0) + appliedCouponDiscount;
      if (Math.abs(totalAmount.toFixed(2) - pgAndCouponTotal.toFixed(2)) > 0.01) {
        paymentMode = `${cardLabel} + Wallet`;
      } else {
        paymentMode = cardLabel;
      }
    }

    // Invoice Total Calculation
    const { subtotal, taxAmount, invoiceTotal } = lineItems.reduce(
      (acc, item) => {
        acc.subtotal += item.taxableAmount;
        acc.taxAmount += item.vat;
        acc.invoiceTotal += item.lineTotal;
        return acc;
      },
      { subtotal: 0, taxAmount: 0, invoiceTotal: 0 }
    );

    const taxLines = isInterState
      ? [
          {
            label: `IGST (${gstRate}%)`,
            amount: amountPrecision(taxAmount),
          },
        ]
      : [
          {
            label: `CGST (${gstRate / 2}%)`,
            amount: amountPrecision(taxAmount / 2),
          },
          {
            label: `SGST (${gstRate / 2}%)`,
            amount: amountPrecision(taxAmount / 2),
          },
        ];

    lineItems = lineItems.filter((item) => item.price > 0 && item.quantity > 0);
    let corporateInvoiceData = {};
    if (lineItems.length > 0) {
      corporateInvoiceData = {
        billedTo: {
          companyName: corporateInfo?.name,
          address: "",
          cityCountry: [
            corporateInfo?.city,
            corporateInfo?.state,
            corporateInfo?.country,
          ]
            .filter((val) => val !== undefined && val !== null && val !== "")
            .join(", "),
          gstin: corporateInfo?.gstNumber,
        },
        dueDate: new Date().toISOString().split("T")[0],
        invoiceNumber: pekoInvoiceId,
        issuedDate: new Date().toISOString().split("T")[0],
        placeOfSupply,
        items: lineItems,
        subtotal: subtotal,
        taxLines,
        total: invoiceTotal,
        note: "Thank you for your business",
      };
    }
    const pekoInvoiceDetails = {
      corporate: {
        invoiceData: corporateInvoiceData,
        receiptData: {
          customerName: corporateInfo?.name,
          customerNumber: corporateInfo?.mobileNo,
          orderNumber: corporateTxnId,
          lineOfBusiness: "Portal",
          paymentType: paymentType,
          paymentDateTime: new Date().toISOString().split("T")[0],
          paymentMode: paymentMode,
          itemServicePrice: Number(amount).toFixed(2),
          platformFee: Number(surcharge).toFixed(2),
          paidAmount: Number(totalAmountPaid).toFixed(2),
          receiptNo: pekoReceiptId,
        },
      },
      vendor: {
        invoiceData: vendorInvoiceData,
      },
    };
    let invoiceHtml = null;
    let receiptHtml = null;
    if (Object.keys(corporateInvoiceData).length > 0) {
      invoiceHtml = taxInvoiceTemplate({
        ...pekoInvoiceDetails.corporate.invoiceData,
      });
    }
    if (Object.keys(pekoInvoiceDetails.corporate.receiptData).length > 0) {
      receiptHtml = paymentReceiptTemplate({
        ...pekoInvoiceDetails.corporate.receiptData,
      });
    }

    const invoicePdf = invoiceHtml
      ? await generatePDFFile(invoiceHtml, itemsList.length > 0 ? "Invoice" : "Invoice-on-Platform-Fee")
      : undefined;
    const receiptPdf = receiptHtml
      ? await generatePDFFile(receiptHtml, "Receipt")
      : undefined;

    const vendorEmailAddress =
      vendor?.vendorEmail && vendor?.vendorEmail?.length > 0
        ? vendor.vendorEmail[0]
        : null;
    if (Object.keys(vendorInvoiceData).length > 0 && vendorEmailAddress) {
      const vendorInvoiceHtml = taxInvoiceTemplate({ ...vendorInvoiceData });
      const vendorInvoicePdf = await generatePDFFile(
        vendorInvoiceHtml,
        "Invoice-on-Commission"
      );
      emailer.emailWithMultipleAttachment(
        vendorEmailAddress,
        "Tax Invoice on Commission - Peko",
        vendorInvoiceEmail({ vendorName: vendor?.vendorName }),
        [vendorInvoicePdf].filter(Boolean),
        undefined,
        async (emailError) => {
          if (emailError) {
            customLog(null, "error", {
              message: "Vendor commission invoice email failed",
              data: emailError?.message || emailError,
            });
          } else {
            customLog(null, "info", {
              message: `Vendor commission invoice emailed to ${vendorEmailAddress}`,
            });
          }
        }
      );
    }

    if (orderId) {
      await updateOrderInvoiceDetails({
        id: orderId,
        data: { pekoInvoiceDetails },
      });
    }

    return {
      success: true,
      message: "Invoice and receipt generated successfully",
      invoicePdf,
      receiptPdf,
      corporateInvoiceId: pekoInvoiceId,
    };
  } catch (error) {
    customLog(null, "error", {
      message: error?.message,
      data: error?.response?.data,
    });
    return { success: false, message: error?.message };
  }
};

const generatePDFFile = async (htmlContent, fileName) => {
  let browser;
  try {
    if (!puppeteer) {
      customLog(null, "error", {
        message: `Skipping ${fileName} PDF render — puppeteer dependency missing in scheduler`,
      });
      return null;
    }
    const outputFile = `${fileName}-${new Date().valueOf()}.pdf`;
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true });
    const pdfBuffer = fs.readFileSync(outputFile);
    fs.unlinkSync(outputFile);
    return {
      filename: outputFile,
      content: pdfBuffer,
    };
  } catch (error) {
    customLog(null, "error", {
      message: error?.message,
      data: error,
    });
    // A failed render returns null so callers can `.filter(Boolean)` attachments.
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateOrderInvoiceAttachments = async ({
  amount,
  surcharge = 0,
  couponDiscount = 0,
  corporateTxnId,
  orderId,
  paymentType = "Other",
  // eslint-disable-next-line no-unused-vars
  description,
  credentialId,
  pgAmount,
  paymentMethod,
  sendInvoiceToVendor = false,
  commissionIncludingGST = 0,
  vendor,
  traceId,
}) => {
  try {
    const { receiptPdf, invoicePdf } = await generateInvoiceAndReceipt({
      itemsList: [],
      amount: parseFloat(amount) || 0,
      surcharge: parseFloat(surcharge) || 0,
      couponDiscount: parseFloat(couponDiscount) || 0,
      corporateTxnId,
      orderId,
      paymentType,
      credentialId,
      pgAmount,
      paymentMethod,
      sendInvoiceToVendor,
      commissionIncludingGST,
      vendor,
    });
    return [receiptPdf, invoicePdf].filter(Boolean);
  } catch (error) {
    customLog(traceId || null, "error", {
      message: "generateOrderInvoiceAttachments failed",
      data: error?.message,
    });
    return [];
  }
};

module.exports = {
  generateInvoiceAndReceipt,
  generateOrderInvoiceAttachments,
};
