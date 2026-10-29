const ErrorResponse = require('../utils/error-response');

// Salary/CTC data is sensitive personal data under India's DPDP Act. These routes are all
// corporate-scoped — they resolve `corporateUserID` straight from `req.user._id` — but an
// ESS/self-service session ('USER' role, set by verifyToken) has `req.user._id` pointing
// at the EMPLOYEE's own id, not a corporate user id. Letting a 'USER' session through
// isn't just a compliance gap, it's a latent correctness bug too: the endpoint would
// silently query every corporate-scoped collection with the wrong id. Corporate-side
// roles (anything other than 'USER') are unaffected — this is additive-only.
exports.verifyCtcAccess = (req, res, next) => {
  if (req.user?.role === 'USER') {
    return next(new ErrorResponse('Not authorized to access salary/CTC data', 403));
  }
  next();
};
