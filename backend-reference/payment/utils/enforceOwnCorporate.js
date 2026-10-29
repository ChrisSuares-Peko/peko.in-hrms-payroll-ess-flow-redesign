"use strict";

// F-PAY-02: the path :corporateId must be one of the caller's own identities (session id / corporateId /
// subCorporateId). Blocks cross-tenant access to payout/NuPay money endpoints. Must run after verifyToken.
const enforceOwnCorporate = (req, res, next) => {
  const pathId = parseInt(req.params.corporateId);
  const own = [req.user?.id, req.user?.corporateId, req.user?.subCorporateId].map(Number).filter(Boolean);
  if (pathId && own.length && !own.includes(pathId)) {
    return res.status(403).json({ status: false, message: "Forbidden", data: {}, responseCode: "001" });
  }
  next();
};

module.exports = { enforceOwnCorporate };
