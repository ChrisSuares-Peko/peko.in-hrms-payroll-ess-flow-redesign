const asyncHandler = require('../../middleware/async');
const { processSalaryPayoutWebhook } = require('../../services/processSalary');
const { processVirtualAccountWithdrawalWebhook } = require('../../services/virtualAccountWithdrawal');

exports.payoutWebhookHandler = asyncHandler(async (req, res) => {
  let data;
  let message;

  try {
    data = await processSalaryPayoutWebhook({
      body: req.body,
      headers: req.headers,
    });
    message = data.alreadyFinalized
      ? 'Salary payout transaction already finalized'
      : 'Salary payout webhook processed successfully';
  } catch (error) {
    if (error?.status_code !== 404) {
      throw error;
    }

    data = await processVirtualAccountWithdrawalWebhook({
      body: req.body,
      headers: req.headers,
    });
    message = data.alreadyFinalized
      ? 'Virtual account withdrawal already finalized'
      : 'Virtual account withdrawal webhook processed successfully';
  }

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message,
    data,
  });
});
