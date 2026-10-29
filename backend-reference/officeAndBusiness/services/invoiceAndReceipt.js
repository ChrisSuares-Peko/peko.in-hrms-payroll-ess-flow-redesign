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
const puppeteer = require("puppeteer");
const fs = require("fs");
const { amountPrecision } = require("../utils/formatter");
const emailer = require("../utils/emailer");
const { vendorInvoiceEmail } = require("../utils/emailTemplates/common");

const generateInvoiceAndReceipt = async ({
  itemsList = [],
  amount,
  surcharge = 0,
  corporateTxnId,
  orderId,
  paymentType = "Other",
  couponDiscount: precomputedCouponDiscount,
  credentialId,
  pgAmount,
  commissionIncludingGST = 0,
  vendor,
  planDetails = [],
  addOnDetails = [],
  commissionMode = "MARGIN",
  sendInvoiceToVendor = true,
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

    // calculate coupon discount if coupon is applied
    let couponDiscount = 0;
    if (precomputedCouponDiscount && parseFloat(precomputedCouponDiscount) > 0) {
      couponDiscount = parseFloat(precomputedCouponDiscount);
    }

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

    // Vendor commission invoice (Peko → vendor): generated when the commission (incl. GST) is positive.
    // commissionIncludingGST only holds the margin / agent markup commission (principal markup is separate).
    // Vendor GST split uses the vendor's GSTIN/state vs the Peko seller state, with
    // the same intra-state (CGST + SGST) fallback when unresolvable.
    const vendorCommissionInclGST = amountPrecision(parseFloat(commissionIncludingGST));
    let vendorInvoiceData = {};
    if (vendorCommissionInclGST > 0) {
      const commissionTaxDetails = calculateAmountAndTax(
        vendorCommissionInclGST,
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
            lineTotal: vendorCommissionInclGST,
          },
        ],
        subtotal: commissionTaxDetails?.actualAmount,
        taxLines: vendorTaxLines,
        total: vendorCommissionInclGST,
        note: "Thank you for your service",
      };
    }

    const pekoInvoiceId = await generatePekoInvoiceId();
    const pekoReceiptId = await generatePekoReceiptId();

    const totalAmountPaid =
      parseFloat(amount) + parseFloat(surcharge) - parseFloat(couponDiscount);
    // Payment mode — 3 cases: WALLET only / PG+WALLET / PG only.
    let paymentMode = "Wallet";
    if (pgAmount) {
      const cardLabel = "Payment Gateway";
      const totalAmount = parseFloat(amount || 0) + parseFloat(surcharge || 0);
      const pgAndCouponTotal =
        parseFloat(pgAmount || 0) + parseFloat(couponDiscount || 0);
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
    const corporateBilledTo = {
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
    };
    let corporateInvoiceData = {};
    if (lineItems.length > 0) {
      corporateInvoiceData = {
        billedTo: corporateBilledTo,
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

    // The plan invoice lists the items sold on a markup basis (agent or principal). An item with no mode of its own
    // takes the order's mode, and a service with no plan lines is one row for what was paid before the platform fee.
    const MARKUP_MODES = ["AGENT_MARKUP", "PRINCIPAL_MARKUP"];
    const orderRowMode = MARKUP_MODES.includes(commissionMode) ? commissionMode : "MARGIN";
    const toPlanRow = (item) => {
      const quantity = Number(item?.quantity ?? 1);
      const unitInclGST = Number(item?.amount || 0);
      const { actualAmount: unitExclGST, taxAmount: unitGst } =
        calculateAmountAndTax(unitInclGST, gstRateDecimal);
      return {
        description: item?.name || "Service",
        quantity,
        price: amountPrecision(unitExclGST),
        taxableAmount: amountPrecision(unitExclGST * quantity),
        vat: amountPrecision(unitGst * quantity),
        lineTotal: amountPrecision(unitInclGST * quantity),
      };
    };
    const sourceItems = [
      ...(Array.isArray(planDetails) ? planDetails : []),
      ...(Array.isArray(addOnDetails) ? addOnDetails : []),
    ];
    const markupRows = (sourceItems.length > 0 ? sourceItems : [{ name: paymentType, amount, quantity: 1 }])
      .map((item) => ({ mode: item?.commissionMode || orderRowMode, row: toPlanRow(item) }))
      .filter(({ mode, row }) => MARKUP_MODES.includes(mode) && row.price > 0 && row.quantity > 0);

    const buildPlanInvoice = async (rows) => {
      if (rows.length === 0) return {};
      const planLineItems = rows.map(({ row }) => row);
      const {
        subtotal: planSubtotal,
        taxAmount: planTaxAmount,
        invoiceTotal: planTotal,
      } = planLineItems.reduce(
        (acc, item) => {
          acc.subtotal += item.taxableAmount;
          acc.taxAmount += item.vat;
          acc.invoiceTotal += item.lineTotal;
          return acc;
        },
        { subtotal: 0, taxAmount: 0, invoiceTotal: 0 }
      );
      const planTaxLines = isInterState
        ? [
            {
              label: `IGST (${gstRate}%)`,
              amount: amountPrecision(planTaxAmount),
            },
          ]
        : [
            {
              label: `CGST (${gstRate / 2}%)`,
              amount: amountPrecision(planTaxAmount / 2),
            },
            {
              label: `SGST (${gstRate / 2}%)`,
              amount: amountPrecision(planTaxAmount / 2),
            },
          ];
      return {
        billedTo: corporateBilledTo,
        dueDate: new Date().toISOString().split("T")[0],
        invoiceNumber: await generatePekoInvoiceId(),
        issuedDate: new Date().toISOString().split("T")[0],
        placeOfSupply,
        items: planLineItems,
        subtotal: planSubtotal,
        taxLines: planTaxLines,
        total: planTotal,
        note: "Thank you for your business",
      };
    };
    const planInvoiceData = await buildPlanInvoice(markupRows);

    // The vendor's copy lists only the agent markup items; a principal markup item is Peko's own sale.
    const agentRows = markupRows.filter(({ mode }) => mode === "AGENT_MARKUP");
    let vendorPlanInvoiceData = {};
    if (Object.keys(vendorInvoiceData).length > 0 && agentRows.length > 0) {
      vendorPlanInvoiceData =
        agentRows.length === markupRows.length ? planInvoiceData : await buildPlanInvoice(agentRows);
    }

    const pekoInvoiceDetails = {
      corporate: {
        invoiceData: corporateInvoiceData,
        planInvoiceData,
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
        planInvoiceData: vendorPlanInvoiceData,
      },
    };
    let invoiceHtml = null;
    let receiptHtml = null;
    let planInvoiceHtml = null;
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
    if (Object.keys(planInvoiceData).length > 0) {
      planInvoiceHtml = taxInvoiceTemplate({ ...planInvoiceData });
    }

    const invoicePdf = invoiceHtml
      ? await generatePDFFile(invoiceHtml, itemsList.length > 0 ? "Invoice" : "Invoice-on-Platform-Fee")
      : undefined;
    const receiptPdf = receiptHtml
      ? await generatePDFFile(receiptHtml, "Receipt")
      : undefined;
    const planInvoicePdf = planInvoiceHtml
      ? await generatePDFFile(planInvoiceHtml, "Invoice")
      : undefined;

    // Fire-and-forget; the plan invoice (Agent Markup) rides along in this same email.
    const vendorEmailAddress =
      vendor?.vendorEmail && vendor?.vendorEmail?.length > 0
        ? vendor.vendorEmail[0]
        : null;
    if (sendInvoiceToVendor && Object.keys(vendorInvoiceData).length > 0 && vendorEmailAddress) {
      const vendorInvoiceHtml = taxInvoiceTemplate({ ...vendorInvoiceData });
      const vendorInvoicePdf = await generatePDFFile(
        vendorInvoiceHtml,
        "Invoice-on-Commission"
      );
      let vendorPlanInvoicePdf = planInvoicePdf;
      if (vendorPlanInvoiceData !== planInvoiceData) {
        vendorPlanInvoicePdf =
          Object.keys(vendorPlanInvoiceData).length > 0
            ? await generatePDFFile(taxInvoiceTemplate({ ...vendorPlanInvoiceData }), "Invoice")
            : undefined;
      }
      emailer.emailWithMultipleAttachment(
        vendorEmailAddress,
        "Tax Invoice on Commission - Peko",
        vendorInvoiceEmail({ vendorName: vendor?.vendorName }),
        [vendorInvoicePdf, vendorPlanInvoicePdf].filter(Boolean),
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
      planInvoicePdf,
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

// (no shared pool), print to a temp file, read the buffer, clean up.
const generatePDFFile = async (htmlContent, fileName) => {
  let browser;
  try {
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
  credentialId,
  pgAmount = 0,
  commissionIncludingGST = 0,
  vendor,
  planDetails = [],
  addOnDetails = [],
  commissionMode = "MARGIN",
  sendInvoiceToVendor = true,
  traceId,
}) => {
  try {
    const { receiptPdf, invoicePdf, planInvoicePdf } = await generateInvoiceAndReceipt({
      itemsList: [],
      amount: parseFloat(amount) || 0,
      surcharge: parseFloat(surcharge) || 0,
      couponDiscount: parseFloat(couponDiscount) || 0,
      corporateTxnId,
      orderId,
      paymentType,
      credentialId,
      pgAmount,
      commissionIncludingGST,
      vendor,
      planDetails,
      addOnDetails,
      commissionMode,
      sendInvoiceToVendor,
    });
    return [receiptPdf, invoicePdf, planInvoicePdf].filter(Boolean);
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
