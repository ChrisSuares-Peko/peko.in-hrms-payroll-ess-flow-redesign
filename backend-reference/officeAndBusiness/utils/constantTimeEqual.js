const crypto = require("crypto");

// F-OAB-17: constant-time secret/key compare that fails closed on a missing or non-string
// operand (so an unconfigured key can't pass as undefined===undefined). Hashing first keeps
// the comparison constant-time regardless of input length.
module.exports = function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};
