/**
 * Static ONDC retail return reason codes for DigiDukaan /update return_request.
 * Codes align with common ONDC RET return reason lists (001–00x).
 */

const RETURN_REASONS = [
  { id: "001", label: "Item defective / not working" },
  { id: "002", label: "Wrong item delivered" },
  { id: "003", label: "Product quality not as expected" },
  { id: "004", label: "Damaged packaging / damaged product" },
  { id: "005", label: "Missing parts / accessories" },
  { id: "006", label: "Expired / near expiry" },
  { id: "007", label: "Ordered by mistake" },
  { id: "008", label: "Other" },
];

const RETURN_REASON_BY_ID = Object.fromEntries(RETURN_REASONS.map((r) => [r.id, r]));

const resolveReturnReason = (reasonId, reasonDesc) => {
  const known = RETURN_REASON_BY_ID[String(reasonId || "")];
  const id = known?.id || String(reasonId || "008");
  const desc =
    (reasonDesc && String(reasonDesc).trim()) ||
    known?.label ||
    RETURN_REASON_BY_ID["008"].label;
  return { reasonId: id, reasonDesc: desc };
};

module.exports = {
  RETURN_REASONS,
  RETURN_REASON_BY_ID,
  resolveReturnReason,
};
