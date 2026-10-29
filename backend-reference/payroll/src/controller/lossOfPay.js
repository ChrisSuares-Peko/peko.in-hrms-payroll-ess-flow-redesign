const asyncHandler = require('../middleware/async');
const { getLossOfPaySheet, saveLossOfPaySheet } = require('../services/lossOfPay');

exports.getLossOfPaySheet = asyncHandler(async (req, res) => {
  const data = await getLossOfPaySheet({
    corporateUserId: req.user._id,
    month: req.query.month,
    year: req.query.year,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Loss of Pay sheet fetched successfully',
    data,
  });
});

exports.saveLossOfPaySheet = asyncHandler(async (req, res) => {
  const data = await saveLossOfPaySheet({
    corporateUserId: req.user._id,
    month: req.body.month,
    year: req.body.year,
    entries: req.body.entries,
    updatedBy: req.user?.email || String(req.user?._id || ''),
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: data.updatedCount
      ? `Loss of Pay saved for ${data.updatedCount} employee${data.updatedCount === 1 ? '' : 's'}`
      : 'No Loss of Pay changes to save',
    data,
  });
});
