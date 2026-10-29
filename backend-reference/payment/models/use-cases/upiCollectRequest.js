const UpiCollectRequest = require('../entities/upiCollectRequest');

async function addUpiCollectRequest(params) {
  // Validate input as necessary

  // Construct object to insert
  const requestObj = {
    payer_upi: params.payer_upi,
    payer_name: params.payer_name,
    amount: params.amount,
    expiry_time: params.expiry_time,
    reference_id: params.reference_id,
    decentro_txn_id: params.decentro_txn_id,
    corporateUser: params.corporateUser,
  };

  // Remove undefined fields
  Object.keys(requestObj).forEach(
    (key) => requestObj[key] === undefined && delete requestObj[key]
  );

  // Create and return the record
  const collectRequest = await UpiCollectRequest.create(requestObj);
  return collectRequest;
}

module.exports = {
  addUpiCollectRequest,
};