// F-PG-02: on routes the user calls directly, the body is fully client-controlled. A client-sent
// gateway response (with its pgAmount) was being treated as proof of a card payment, so the wallet
// was debited only (total - pgAmount): free products, or wallet credit when pgAmount > total.
// Real card payments are settled by the Cashfree callback in cashFreeGateway.js, which calls the
// service handlers directly in code and never goes through these routers.
const CLIENT_PG_PROOF_FIELDS = ['paymentGatewayResponse', 'razorPay', 'paytmResponse'];

const rejectClientPgProof = (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (CLIENT_PG_PROOF_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
    return res.status(400).json({
      status: false,
      message: 'Card payments are processed through the payment gateway.',
      data: {},
      responseCode: '001',
    });
  }
  return next();
};

module.exports = rejectClientPgProof;
