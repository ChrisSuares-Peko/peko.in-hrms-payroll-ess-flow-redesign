const GlobalBusinessSetupApplication = require("../../entities/globalBusinessSetup/application");

// ── Helpers ────────────────────────────────────────────────────────────────

// Map a raw vendor company doc → cache-safe projection we store.
// Only static fields + `is_paid` (which flips on our payment event). Volatile
// vendor fields like `status`, `vendor_updated_at` are deliberately excluded.
const projectVendorDoc = (vendorDoc, { referenceId, userId } = {}) => ({
    vendor_app_id:     vendorDoc?._id,
    reference_id:      referenceId ?? vendorDoc?.reference_id,
    user_id:           userId,
    proposed_name:     vendorDoc?.proposed_name,
    country:           vendorDoc?.country
        ? {
              _id:  typeof vendorDoc.country === "object" ? vendorDoc.country._id : vendorDoc.country,
              name: typeof vendorDoc.country === "object" ? vendorDoc.country.name : undefined,
          }
        : undefined,
    type:              vendorDoc?.type,
    freezone:          vendorDoc?.freezone,
    is_paid:           Boolean(vendorDoc?.is_paid),
    provider_id:
        typeof vendorDoc?.provider === "object" ? vendorDoc?.provider?._id : vendorDoc?.provider,
    application_id:    vendorDoc?.application_id,
    tracking_id:       vendorDoc?.tracking_id,
    vendor_created_at: vendorDoc?.created_at ? new Date(vendorDoc.created_at) : undefined,
    synced_at:         new Date(),
});

// ── Upserts ────────────────────────────────────────────────────────────────

exports.upsertApplicationFromVendor = async (vendorDoc, referenceId, userId) => {
    if (!vendorDoc?._id) return null;
    const doc = projectVendorDoc(vendorDoc, { referenceId, userId });
    return GlobalBusinessSetupApplication.findOneAndUpdate(
        { vendor_app_id: doc.vendor_app_id },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
};

exports.bulkUpsertApplications = async (vendorDocs = [], referenceId, userId) => {
    const ops = vendorDocs
        .filter(d => d?._id)
        .map(d => ({
            updateOne: {
                filter: { vendor_app_id: d._id },
                update: { $set: projectVendorDoc(d, { referenceId, userId }) },
                upsert: true,
            },
        }));
    if (!ops.length) return { upserted: 0 };
    const res = await GlobalBusinessSetupApplication.bulkWrite(ops, { ordered: false });
    return { upserted: res.upsertedCount + res.modifiedCount };
};

// ── Reads ──────────────────────────────────────────────────────────────────

exports.hasAnyApplication = async referenceId => {
    if (!referenceId) return false;
    const count = await GlobalBusinessSetupApplication.countDocuments({ reference_id: referenceId }).limit(1);
    return count > 0;
};

// Shape the response to match what the frontend already expects from the
// vendor: { companies: [...], total: N }. Listings don't display `status` —
// it's looked up fresh on the detail page.
exports.findApplicationsByFilter = async ({
    referenceId,
    isPaid,
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort,
    from,
    to,
}) => {
    const query = { reference_id: referenceId };
    if (typeof isPaid === "boolean") query.is_paid = isPaid;
    if (from || to) {
        query.vendor_created_at = {};
        if (from) query.vendor_created_at.$gte = new Date(from);
        if (to) query.vendor_created_at.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (searchText) {
        const rx = new RegExp(escapeRegex(searchText), "i");
        query.$or = [
            { proposed_name:  rx },
            { application_id: rx },
            { tracking_id:    rx },
        ];
    }

    const sortDirection = String(sort || "DESC").toUpperCase() === "ASC" ? 1 : -1;
    const skip = (Math.max(1, Number(page)) - 1) * Number(itemsPerPage);
    const limit = Number(itemsPerPage);

    const [rows, total] = await Promise.all([
        GlobalBusinessSetupApplication.find(query)
            .sort({ vendor_created_at: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean(),
        GlobalBusinessSetupApplication.countDocuments(query),
    ]);

    return {
        companies: rows.map(toVendorShape),
        total,
    };
};

// Convert the cached doc back to the shape the frontend already consumes (so
// the listing hook/columns don't change). Omits dynamic vendor state.
const toVendorShape = doc => ({
    _id:            doc.vendor_app_id,
    reference_id:   doc.reference_id,
    application_id: doc.application_id,
    tracking_id:    doc.tracking_id,
    proposed_name:  doc.proposed_name,
    country:        doc.country,
    type:           doc.type,
    freezone:       doc.freezone,
    is_paid:        doc.is_paid,
    created_at:     doc.vendor_created_at,
});

// Admin report — returns ALL cached applications across users (no
// reference_id filter) with raw schema fields so admins see the full record.
exports.findAllApplicationsForAdmin = async ({
    page = 1,
    itemsPerPage = 10,
    searchText,
    isPaid,
    sort,
} = {}) => {
    const query = {};
    if (typeof isPaid === "boolean") query.is_paid = isPaid;
    if (searchText) {
        const rx = new RegExp(escapeRegex(searchText), "i");
        query.$or = [
            { proposed_name:  rx },
            { application_id: rx },
            { tracking_id:    rx },
            { reference_id:   rx },
        ];
    }

    const sortDirection = String(sort || "DESC").toUpperCase() === "ASC" ? 1 : -1;
    const skip = (Math.max(1, Number(page)) - 1) * Number(itemsPerPage);
    const limit = Number(itemsPerPage);

    const [rows, total] = await Promise.all([
        GlobalBusinessSetupApplication.find(query)
            .sort({ vendor_created_at: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean(),
        GlobalBusinessSetupApplication.countDocuments(query),
    ]);

    return { applications: rows, total };
};

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
