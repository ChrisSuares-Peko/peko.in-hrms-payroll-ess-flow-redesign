'use strict';

const { findPurchaseOrder, addNote, listNotes } = require('../../../models/use-cases/procure/purchaseOrderNote');
const asyncHandler               = require('../../../middlewares/async');
const ErrorResponse              = require('../../../utils/error-response');

exports.addNote = asyncHandler(async (req, res, next) => {
  const corporateUserId = req.user.corporateId;
  const { id }          = req.params;
  const { note }        = req.body;

  const po = await findPurchaseOrder({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  const created = await addNote({ purchaseOrderId: id, corporateUserId, note });

  return res.status(201).json({
    status: true,
    message: 'Note added successfully',
    data: created,
    responseCode: '000',
  });
});

exports.listNotes = asyncHandler(async (req, res, next) => {
  const corporateUserId = req.user.corporateId;
  const { id }          = req.params;

  const po = await findPurchaseOrder({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  const notes = await listNotes({ purchaseOrderId: id });

  return res.status(200).json({
    status: true,
    message: 'Notes fetched successfully',
    data: notes,
    responseCode: '000',
  });
});
