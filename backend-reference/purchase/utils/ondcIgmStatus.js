/**
 * IGM status vocabulary and the wire <-> internal translation, in one place.
 *
 * Peko keeps its own status names (ondcIssues.status / ondcIssueEvents.eventType)
 * and translates at the boundary. This module owns both directions plus the
 * terminal set, which was previously copy-pasted into three controllers and kept
 * in sync by comment.
 *
 * The mapping is EXACT, not substring. The old substring version had a trap:
 * "RESOLUTION_PROPOSED".includes("RESOLV") is true, so a merely *proposed*
 * resolution was recorded as RESOLVED — a terminal status — which blocked the
 * buyer from accepting or rejecting the very resolution they had just been
 * offered. IGM 2.0 makes that path routine, so exact matching is required.
 */

/** Internal status vocabulary. Stored in the DB; never sent on the wire. */
const ISSUE_STATUS = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  INFO_REQUESTED: "INFO_REQUESTED",
  RESPONSE_RECEIVED: "RESPONSE_RECEIVED",
  RESOLUTION_PROPOSED: "RESOLUTION_PROPOSED",
  RESOLUTION_ACCEPTED: "RESOLUTION_ACCEPTED",
  RESOLUTION_REJECTED: "RESOLUTION_REJECTED",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  ESCALATED: "ESCALATED",
  CLOSED: "CLOSED",
};

/**
 * Once an issue is in one of these, no further buyer/seller action moves it.
 *
 * RESOLUTION_PROPOSED / _ACCEPTED / _REJECTED are deliberately NOT here: an IGM
 * 2.0 resolution can be proposed, rejected, and re-proposed several times before
 * anything is final. Treating a rejection as terminal would strand the thread.
 */
const TERMINAL_ISSUE_STATUSES = [
  ISSUE_STATUS.RESOLVED,
  ISSUE_STATUS.REJECTED,
  ISSUE_STATUS.CLOSED,
];

const isTerminalIssueStatus = (status) =>
  TERMINAL_ISSUE_STATUSES.includes(String(status || "").toUpperCase());

/**
 * IGM 2.0 action codes (ONDC-NTS-Specifications, api/components/enums) mapped
 * onto our internal vocabulary. IGM 1.0's looser respondent_action strings are
 * folded in as aliases so a counterparty still on 1.0 classifies correctly.
 */
const WIRE_TO_INTERNAL = {
  // lifecycle
  OPEN: ISSUE_STATUS.OPEN,
  PROCESSING: ISSUE_STATUS.ACKNOWLEDGED,
  RESOLVED: ISSUE_STATUS.RESOLVED,
  CLOSED: ISSUE_STATUS.CLOSED,
  ESCALATED: ISSUE_STATUS.ESCALATED,
  CASCADED: ISSUE_STATUS.ACKNOWLEDGED,

  // information exchange
  INFO_REQUESTED: ISSUE_STATUS.INFO_REQUESTED,
  INFO_PROCESSING: ISSUE_STATUS.ACKNOWLEDGED,
  INFO_PROVIDED: ISSUE_STATUS.RESPONSE_RECEIVED,
  INFO_NOT_AVAILABLE: ISSUE_STATUS.ACKNOWLEDGED,

  // resolution negotiation — none of these are terminal
  RESOLUTION_PROPOSED: ISSUE_STATUS.RESOLUTION_PROPOSED,
  RESOLUTION_ACCEPTED: ISSUE_STATUS.RESOLUTION_ACCEPTED,
  RESOLUTION_REJECTED: ISSUE_STATUS.RESOLUTION_REJECTED,
  RESOLUTION_FORWARDED: ISSUE_STATUS.ACKNOWLEDGED,
  RESOLUTION_PROCESSING: ISSUE_STATUS.ACKNOWLEDGED,
  RESOLUTION_CASCADED: ISSUE_STATUS.ACKNOWLEDGED,

  // IGM 1.0 aliases
  "NEED-MORE-INFO": ISSUE_STATUS.INFO_REQUESTED,
  NEED_MORE_INFO: ISSUE_STATUS.INFO_REQUESTED,
  REJECT: ISSUE_STATUS.REJECTED,
  REJECTED: ISSUE_STATUS.REJECTED,
  CLOSE: ISSUE_STATUS.CLOSED,
};

/**
 * A counterparty action code -> our internal status.
 *
 * Unknown codes fall back to ACKNOWLEDGED ("the other side is working it") so a
 * vocabulary we haven't seen yet is never hidden from the buyer — but it is
 * never guessed into a terminal status, which is what the substring version did.
 *
 * @param {string} raw the wire code, e.g. "RESOLUTION_PROPOSED"
 * @returns {string} an ISSUE_STATUS value
 */
const mapWireActionToStatus = (raw) => {
  const code = String(raw || "").trim().toUpperCase();
  return WIRE_TO_INTERNAL[code] || ISSUE_STATUS.ACKNOWLEDGED;
};

/**
 * Our internal status -> the IGM 2.0 action code to put on the wire.
 *
 * Needed because the outbound payload replays the whole action history, and we
 * previously echoed internal names (ACKNOWLEDGED, RESPONSE_RECEIVED) that are
 * not IGM codes at all.
 */
const INTERNAL_TO_WIRE = {
  [ISSUE_STATUS.OPEN]: "OPEN",
  [ISSUE_STATUS.ACKNOWLEDGED]: "PROCESSING",
  [ISSUE_STATUS.INFO_REQUESTED]: "INFO_REQUESTED",
  [ISSUE_STATUS.RESPONSE_RECEIVED]: "INFO_PROVIDED",
  [ISSUE_STATUS.RESOLUTION_PROPOSED]: "RESOLUTION_PROPOSED",
  [ISSUE_STATUS.RESOLUTION_ACCEPTED]: "RESOLUTION_ACCEPTED",
  [ISSUE_STATUS.RESOLUTION_REJECTED]: "RESOLUTION_REJECTED",
  [ISSUE_STATUS.RESOLVED]: "RESOLVED",
  [ISSUE_STATUS.REJECTED]: "RESOLUTION_REJECTED",
  [ISSUE_STATUS.ESCALATED]: "ESCALATED",
  [ISSUE_STATUS.CLOSED]: "CLOSED",
};

const mapStatusToWireAction = (status) =>
  INTERNAL_TO_WIRE[String(status || "").toUpperCase()] || "PROCESSING";

/** Buyer-visible copy when a 2.0 action has no descriptor.short_desc. */
const ACTION_FALLBACK_LABELS = {
  OPEN: "Issue opened",
  PROCESSING: "Seller is processing your complaint",
  INFO_REQUESTED: "Seller has asked for more information",
  INFO_PROVIDED: "Additional information sent",
  RESOLUTION_PROPOSED: "Seller has proposed a resolution",
  RESOLUTION_ACCEPTED: "Resolution accepted",
  RESOLUTION_REJECTED: "Resolution rejected",
  ESCALATED: "Issue escalated",
  RESOLVED: "Seller has resolved this issue",
  CLOSED: "Issue closed",
  CASCADED: "Seller is processing your complaint",
};

/**
 * Prefer the wire short_desc; otherwise a stable label so the thread is never blank.
 *
 * @param {string} code IGM action code
 * @param {string} [message]
 * @returns {string}
 */
const fallbackActionMessage = (code, message) => {
  const text = String(message || "").trim();
  if (text) return text;
  const key = String(code || "").trim().toUpperCase();
  return ACTION_FALLBACK_LABELS[key] || "Seller updated this issue";
};

/**
 * The wire `issue.status` (OPEN | PROCESSING | RESOLVED | CLOSED) for a given
 * internal status. Distinct from the action code: a RESOLUTION_PROPOSED action
 * leaves the issue PROCESSING.
 */
const mapStatusToWireStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === ISSUE_STATUS.OPEN || s === ISSUE_STATUS.ESCALATED) return "OPEN";
  if (s === ISSUE_STATUS.CLOSED) return "CLOSED";
  if (s === ISSUE_STATUS.RESOLVED) return "RESOLVED";
  return "PROCESSING";
};

/**
 * The escalated level.
 *
 * IGM 2.0.0 spells this GRIEVANCE, but the deployed Workbench validator
 * (automation-specifications@release-eks-RET10-1.2.5, VALID_ENUM_MESSAGE_LEVEL)
 * enums level as ISSUE | GREVIENCE | DISPUTE — misspelled, with GRIEVANCE absent
 * entirely, so the spec-correct value fails that check. Flip to "GRIEVANCE" for
 * a spec-conformance run.
 */
const ISSUE_LEVEL = {
  ISSUE: "ISSUE",
  GRIEVANCE: "GREVIENCE",
};

/** Workbench VALID_ENUM_MESSAGE_LEVEL — never send spec-correct "GRIEVANCE". */
const WIRE_ISSUE_LEVELS = ["ISSUE", "GREVIENCE", "DISPUTE"];

/**
 * Coerce any inbound/session level onto the Workbench enum.
 *
 * JSONPath `all in` treats a missing/null/"" value as absent (REQUIRED_MESSAGE_LEVEL)
 * and rejects "GRIEVANCE" plus any array wrapper. Always return a scalar string
 * from WIRE_ISSUE_LEVELS so /issue cannot omit or mis-spell `message.issue.level`.
 */
const toWireIssueLevel = (level) => {
  const raw = Array.isArray(level) ? level[0] : level;
  const token = String(raw || "").trim().toUpperCase();
  if (token === "GRIEVANCE" || token === "GREVIENCE") return "GREVIENCE";
  if (token === "DISPUTE") return "DISPUTE";
  return "ISSUE";
};

/** Either spelling counts as escalated, whichever the counterparty sends. */
const isEscalatedLevel = (level) =>
  ["GRIEVANCE", "GREVIENCE"].includes(String(level || "").toUpperCase());

module.exports = {
  ISSUE_STATUS,
  ISSUE_LEVEL,
  WIRE_ISSUE_LEVELS,
  TERMINAL_ISSUE_STATUSES,
  ACTION_FALLBACK_LABELS,
  isTerminalIssueStatus,
  isEscalatedLevel,
  toWireIssueLevel,
  mapWireActionToStatus,
  mapStatusToWireAction,
  mapStatusToWireStatus,
  fallbackActionMessage,
};
