/**
 * IGM 2.0.0 issue payload builders (actors / refs / actions).
 *
 * Workbench Delivery_Flow_With_IGM(v-2.0.0) uses this schema. IGM 1.0
 * `issue_actions{}` stays in services/ondc.js `issue()` for production sellers.
 * Follow-ups replay `igmMeta` so action_by / respondent_ids match what the
 * seller published, not invented NP ids.
 */

const { v4: uuidv4 } = require("uuid");
const { ISSUE_LEVEL, toWireIssueLevel } = require("../utils/ondcIgmStatus");

const IGM2_UPDATE_TARGET = [{ path: "issue.actions", action: "APPENDED" }];

const IGM2_ADDITIONAL_DESC = {
  url: "https://example.com/issue-details",
  content_type: "text/plain",
};

const withAdditionalDesc = (descriptor = {}) => ({
  ...descriptor,
  additional_desc: {
    url: descriptor.additional_desc?.url || IGM2_ADDITIONAL_DESC.url,
    content_type: descriptor.additional_desc?.content_type || IGM2_ADDITIONAL_DESC.content_type,
  },
});

const mergeActions = (existing, incoming) => {
  const list = Array.isArray(existing) ? existing : [];
  const seen = new Set(list.map((a) => a && a.id).filter(Boolean));
  const merged = [...list];
  for (const action of incoming || []) {
    if (action && action.id && !seen.has(action.id)) {
      seen.add(action.id);
      merged.push(action);
    }
  }
  return merged;
};

const mergeActors = (existing, incoming) => {
  const byId = new Map(
    (Array.isArray(existing) ? existing : [])
      .filter((a) => a && a.id)
      .map((a) => [a.id, a])
  );
  for (const actor of incoming || []) {
    if (actor && actor.id) byId.set(actor.id, actor);
  }
  return [...byId.values()];
};

const asBecknImages = (images) =>
  (Array.isArray(images) ? images : [])
    .map((entry) => (typeof entry === "string" ? { url: entry, size_type: "xs" } : entry))
    .filter((entry) => entry && entry.url);

const buildIgm2Action = ({
  id,
  code,
  shortDesc,
  updatedAt,
  actionBy,
  actorName,
  refId,
  refType,
  images,
  tags,
}) => {
  const action = {
    id,
    descriptor: {
      code,
      ...(shortDesc ? { short_desc: shortDesc } : {}),
      ...(images && images.length ? { images: asBecknImages(images) } : {}),
    },
    updated_at: updatedAt,
    action_by: actionBy,
    ...(actorName ? { actor_details: { name: actorName } } : {}),
  };
  if (refId) action.ref_id = refId;
  if (refType) action.ref_type = refType;
  if (tags && tags.length) action.tags = tags;
  return action;
};

const quoteItemRows = (order) => {
  const rows = order?.quote?.rows;
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r && (r.titleType === "item" || r.itemId) && r.itemId);
};

const buildIgm2Refs = (order) => {
  const refs = [];
  if (order?.orderId) refs.push({ ref_type: "ORDER", ref_id: String(order.orderId) });
  if (order?.providerId) refs.push({ ref_type: "PROVIDER", ref_id: String(order.providerId) });
  const fulfillment = (order?.fulfillments || []).find((f) => f && f.id);
  if (fulfillment?.id) refs.push({ ref_type: "FULFILLMENT", ref_id: String(fulfillment.id) });
  const item = quoteItemRows(order)[0];
  if (item?.itemId) {
    refs.push({
      ref_type: "ITEM",
      ref_id: String(item.itemId),
      tags: [
        {
          descriptor: { code: "message.order.items" },
          list: [
            {
              descriptor: { code: "quantity.selected.count" },
              value: String(item.quantity || 1),
            },
          ],
        },
      ],
    });
  }
  return refs;
};

const descriptorCodeForCategory = (category, subCategory) => {
  if (subCategory && /^[A-Z]{3}\d+$/i.test(String(subCategory))) {
    return String(subCategory).toUpperCase();
  }
  const cat = String(category || "ITEM").toUpperCase();
  if (cat === "FULFILLMENT") return "FLM002";
  if (cat === "ORDER") return "ORD001";
  if (cat === "AGENT") return "AGT001";
  // Workbench Delivery_Flow_With_IGM(v-2.0.0) expects an ITEM descriptor; ITM004 matches the runbook.
  return "ITM004";
};

const buyerContactFromOrder = (order) => ({
  person: { name: order?.billing?.name || "Buyer" },
  contact: {
    phone: order?.billing?.phone || order?.billing?.contact?.phone || "",
    email: order?.billing?.email || order?.billing?.contact?.email || "",
  },
});

const seedIgm2OpenSession = ({
  cfg,
  order,
  issueId,
  category,
  subCategory,
  description,
  images = [],
  now,
}) => {
  const consumerId = uuidv4();
  const openActionId = uuidv4();
  const npId = cfg.bapId;
  const orgName = `${npId}::${cfg.domain || order?.domain || "ONDC:RET10"}`;
  const info = { ...buyerContactFromOrder(order), org: { name: orgName } };
  const openAction = buildIgm2Action({
    id: openActionId,
    code: "OPEN",
    shortDesc: description,
    updatedAt: now,
    actionBy: npId,
    actorName: info.person.name,
    images,
  });
  return {
    issue_id: issueId,
    level: toWireIssueLevel(ISSUE_LEVEL.ISSUE),
    consumer_actor_id: consumerId,
    complainant_id: npId,
    open_action_id: openActionId,
    last_action_id: openActionId,
    created_at: now,
    refs: buildIgm2Refs(order),
    actors: [
      { id: consumerId, type: "CONSUMER", info },
      { id: npId, type: "INTERFACING_NP", info },
    ],
    actions: [openAction],
    resolutions: [],
    descriptor: withAdditionalDesc({
      code: descriptorCodeForCategory(category, subCategory),
      short_desc: description,
      long_desc: description,
      images: asBecknImages(images),
    }),
  };
};

const sessionFromIssuePayload = (issuePayload, existing = {}) => {
  const prev = existing && typeof existing === "object" ? existing : {};
  const next = {
    ...prev,
    issue_id: issuePayload?.id || prev.issue_id,
    consumer_actor_id: prev.consumer_actor_id || issuePayload?.source_id || "",
    complainant_id: prev.complainant_id || issuePayload?.complainant_id || "",
    last_action_id: issuePayload?.last_action_id || prev.last_action_id,
    created_at: prev.created_at || issuePayload?.created_at || "",
    refs: Array.isArray(issuePayload?.refs) && issuePayload.refs.length ? issuePayload.refs : prev.refs || [],
    actors: mergeActors(prev.actors, issuePayload?.actors),
    actions: mergeActions(prev.actions, issuePayload?.actions),
    resolutions: Array.isArray(issuePayload?.resolutions) && issuePayload.resolutions.length
      ? issuePayload.resolutions
      : prev.resolutions || [],
    descriptor: issuePayload?.descriptor || prev.descriptor,
  };
  next.level = toWireIssueLevel(issuePayload?.level || next.level);
  return next;
};

const counterpartyNpId = (session) => {
  const np = (session?.actors || []).find((a) => a.type === "COUNTERPARTY_NP");
  return np?.id || null;
};

/**
 * Prefer the Workbench replacement option (R2 / REPLACEMENT), else a preferred id, else first non-PARENT.
 */
const pickIgm2Resolution = (resolutions, { preferredId, preferReplacement = false } = {}) => {
  const list = Array.isArray(resolutions) ? resolutions : [];
  if (preferredId) {
    const hit = list.find((r) => r && r.id === preferredId);
    if (hit) return hit;
  }
  if (preferReplacement) {
    const replacement = list.find(
      (r) => r?.id === "R2" || r?.descriptor?.code === "REPLACEMENT"
    );
    if (replacement) return replacement;
  }
  return list.find((r) => r?.descriptor?.code && r.descriptor.code !== "PARENT") || list[0] || null;
};

const appendBuyerAction = (session, { bapId, code, shortDesc, now, actorName, refId, refType, tags, images, extra }) => {
  const actionId = uuidv4();
  const action = buildIgm2Action({
    id: actionId,
    code,
    shortDesc,
    updatedAt: now,
    actionBy: bapId,
    actorName: actorName || "Buyer",
    refId,
    refType,
    tags,
    images,
  });
  return {
    ...session,
    ...(extra || {}),
    last_action_id: actionId,
    actions: mergeActions(session.actions || [], [action]),
  };
};

const buildIgm2IssueMessage = (session, { issueId, status, now, withUpdateTarget = false }) => {
  const respondentId = counterpartyNpId(session);
  const issue = {
    id: issueId,
    status: status || "PROCESSING",
    level: toWireIssueLevel(session && session.level),
    created_at: session.created_at,
    updated_at: now,
    source_id: session.consumer_actor_id,
    complainant_id: session.complainant_id,
    last_action_id: session.last_action_id,
    descriptor: withAdditionalDesc(session.descriptor),
    refs: session.refs || [],
    actors: session.actors || [],
    actions: session.actions || [],
  };
  if (!withUpdateTarget) {
    issue.expected_response_time = { duration: "PT2H" };
    issue.expected_resolution_time = { duration: "P1D" };
  }
  if (respondentId) {
    issue.respondent_ids = [respondentId];
    issue.resolver_ids = [respondentId];
  }
  if (Array.isArray(session.resolutions) && session.resolutions.length) {
    issue.resolutions = session.resolutions;
  }
  return {
    ...(withUpdateTarget ? { update_target: IGM2_UPDATE_TARGET } : {}),
    issue,
  };
};

const isWorkbenchSeller = (bppId, bppUri) =>
  /workbench\.ondc\.tech/i.test(`${bppId || ""}\n${bppUri || ""}`);

const shouldUseIgm2 = (cfg, { bppId, bppUri } = {}) =>
  Boolean(cfg?.workbenchMode) || isWorkbenchSeller(bppId, bppUri);

module.exports = {
  IGM2_UPDATE_TARGET,
  mergeActions,
  mergeActors,
  buildIgm2Action,
  buildIgm2Refs,
  descriptorCodeForCategory,
  seedIgm2OpenSession,
  sessionFromIssuePayload,
  pickIgm2Resolution,
  appendBuyerAction,
  buildIgm2IssueMessage,
  counterpartyNpId,
  shouldUseIgm2,
  isWorkbenchSeller,
};
