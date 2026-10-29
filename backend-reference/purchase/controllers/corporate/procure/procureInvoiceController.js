'use strict';

const asyncHandler       = require('../../../middlewares/async');
const ErrorResponse      = require('../../../utils/error-response');
const { uploadFile } = require('../../../utils/commonUploadFile');
const {
  findPurchaseOrder, createInvoice, listInvoices, getInvoiceById, updateInvoice, deleteInvoice, closePoIfFullyPaid, sumInvoiceAmounts,
} = require('../../../models/use-cases/procure/procureInvoice');
const { customLog } = require('../../../utils/loggerHelper');

const getCorporateId = (req) => {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) return req.user.subCorporateId;
  return req.user.corporateId;
};
const S3_FOLDER      = 'procure/invoices';

async function uploadAttachmentsToS3(attachments = [], corporateUserId) {
  if (!attachments.length) return [];
  return Promise.all(
    attachments.map(async (f) => {
      const url = await uploadFile(f.fileBase64, `${S3_FOLDER}/${corporateUserId}`, f.fileFormat);
      return { fileName: f.fileName, url, uploadedAt: new Date().toISOString() };
    })
  );
}

exports.create = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { purchaseOrderId, attachments: rawAttachments = [], ...data } = req.body;

  const po = await findPurchaseOrder({ id: purchaseOrderId, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));
  if (po.status === 'Cancelled') return next(new ErrorResponse('This purchase order has been cancelled', 400));

  const invoiceAmount = parseFloat(data.amount);
  const alreadyInvoiced = await sumInvoiceAmounts({ purchaseOrderId, corporateUserId });
  if (alreadyInvoiced + invoiceAmount > parseFloat(po.totalAmount))
    return next(new ErrorResponse(`Invoice amount exceeds remaining PO value. PO total: ${po.totalAmount}, already invoiced: ${alreadyInvoiced}`, 400));

  const attachments = await uploadAttachmentsToS3(rawAttachments, corporateUserId);

  const invoice = await createInvoice({
    corporateUserId,
    purchaseOrderId,
    vendorId: po.vendorId,
    data: { ...data, attachments },
  });

  return res.status(201).json({
    status: true,
    message: 'Invoice created successfully',
    data: invoice,
    responseCode: '000',
  });
});

exports.list = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { purchaseOrderId, status, paymentStatus, searchText, page = 1, limit = 20 } = req.query;

  const result = await listInvoices({
    corporateUserId,
    purchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : undefined,
    status,
    paymentStatus,
    searchText,
    page: Number(page),
    limit: Number(limit),
  });

  return res.status(200).json({
    status: true,
    message: 'Invoices fetched successfully',
    data: result.rows,
    total: result.count,
    responseCode: '000',
  });
});

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const invoice = await getInvoiceById({ id, corporateUserId });
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Invoice fetched successfully',
    data: invoice,
    responseCode: '000',
  });
});

exports.update = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;
  const { attachments: rawAttachments, ...data } = req.body;

  if (rawAttachments) {
    data.attachments = await uploadAttachmentsToS3(rawAttachments, corporateUserId);
  }

  const invoice = await updateInvoice({ id, corporateUserId, data });
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Invoice updated successfully',
    data: invoice,
    responseCode: '000',
  });
});

exports.remove = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const result = await deleteInvoice({ id, corporateUserId });
  if (!result) return next(new ErrorResponse('Invoice not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Invoice deleted successfully',
    data: null,
    responseCode: '000',
  });
});


exports.getAttachmentUrl = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id, index }   = req.params;

  const invoice = await getInvoiceById({ id, corporateUserId });
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  const att = (invoice.attachments ?? [])[Number(index)];
  if (!att) return next(new ErrorResponse('Attachment not found', 404));

  return res.status(200).json({ status: true, data: { url: att.url }, responseCode: '000' });
});

exports.payInvoice = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;
  const invoice = await getInvoiceById({ id, corporateUserId });
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  // if (invoice.status !== 'Approved')
  //   return next(new ErrorResponse(`Invoice must be Approved to initiate payment (current: ${invoice.status})`, 400));

  if (invoice.paymentStatus === 'PAID' || invoice.paymentStatus === 'PROCESSING')
    return next(new ErrorResponse('Payment already initiated for this invoice', 400));

  const vendor = invoice.purchaseOrder?.vendor;
  customLog(req?.LogTraceId, 'info', { message: 'Vendor details for invoice payment', vendor });
  
  // TODO: re-enable payout transfer via payment MS when payout is re-activated
  // if (!vendor?.payoutBeneficiaryId)
  //   return next(new ErrorResponse('Vendor is not registered as a payout beneficiary. Save vendor bank details first.', 400));
  // const paymentServiceUrl = process.env.STAGING_URL || 'https://uatinapi.pekoapp.com';
  // const { data } = await axios.post(
  //   `${paymentServiceUrl}/api/v1/corporate/${req.user.id}/payment/payout/transfer`,
  //   { beneficiaryId: vendor.payoutBeneficiaryId, amount: invoice.amount, transferType, virtualAccountNumber, category: 'VENDOR_PAYMENT', remarks: `Invoice ${invoice.invoiceNumber}` },
  //   { headers: { Authorization: req.headers.authorization, userdata: encodeURI(JSON.stringify(req.user)), sessionid: req.headers.sessionid } }
  // );

  await updateInvoice({
    id,
    corporateUserId,
    data: { paymentStatus: 'PAID', status: 'Paid' },
  });

  await closePoIfFullyPaid({ purchaseOrderId: invoice.purchaseOrderId, corporateUserId });

  return res.status(200).json({
    status: true,
    message: 'Invoice marked as paid successfully',
    responseCode: '000',
    data: { invoiceId: Number(id), paymentStatus: 'PAID' },
  });
});
