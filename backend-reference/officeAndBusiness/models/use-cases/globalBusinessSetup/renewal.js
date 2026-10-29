const GlobalBusinessSetupRenewal = require("../../entities/globalBusinessSetup/renewal");

// ── Helpers ────────────────────────────────────────────────────────────────

const resolveCompanyName = vendorDoc => {
    if (vendorDoc?.company && typeof vendorDoc.company === "object") {
        return vendorDoc.company.proposed_name;
    }
    return vendorDoc?.external_company?.name;
};

const resolveCountryName = vendorDoc => {
    const ec = vendorDoc?.external_company;
    if (ec?.country) {
        if (typeof ec.country === "string") return ec.country;
        return ec.country?.name;
    }
    if (vendorDoc?.company && typeof vendorDoc.company === "object") {
        return vendorDoc.company?.country?.name;
    }
    return undefined;
};

const resolveFreezone = vendorDoc => {
    return (
        vendorDoc?.external_company?.freezone ||
        (vendorDoc?.company && typeof vendorDoc.company === "object"
            ? vendorDoc.company?.freezone
            : undefined)
    );
};

// Only static fields + `due_date` (rarely changes; reconciled on detail
// fetch). Volatile fields (`status`, `priority`, `vendor_updated_at`)
// deliberately excluded.
const projectVendorDoc = (vendorDoc, { referenceId, userId } = {}) => ({
    vendor_renewal_id: vendorDoc?._id,
    reference_id:      referenceId ?? vendorDoc?.reference_id,
    user_id:           userId,
    renewal_type:      vendorDoc?.renewal_type,
    company_name:      resolveCompanyName(vendorDoc),
    country_name:      resolveCountryName(vendorDoc),
    freezone:          resolveFreezone(vendorDoc),
    due_date:          vendorDoc?.due_date ? new Date(vendorDoc.due_date) : undefined,
    application_id:    vendorDoc?.application_id,
    vendor_created_at: vendorDoc?.created_at ? new Date(vendorDoc.created_at) : undefined,
    synced_at:         new Date(),
});

// ── Upserts ────────────────────────────────────────────────────────────────

exports.upsertRenewalFromVendor = async (vendorDoc, referenceId, userId) => {
    if (!vendorDoc?._id) return null;
    const doc = projectVendorDoc(vendorDoc, { referenceId, userId });
    return GlobalBusinessSetupRenewal.findOneAndUpdate(
        { vendor_renewal_id: doc.vendor_renewal_id },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
};

exports.bulkUpsertRenewals = async (vendorDocs = [], referenceId, userId) => {
    const ops = vendorDocs
        .filter(d => d?._id)
        .map(d => ({
            updateOne: {
                filter: { vendor_renewal_id: d._id },
                update: { $set: projectVendorDoc(d, { referenceId, userId }) },
                upsert: true,
            },
        }));
    if (!ops.length) return { upserted: 0 };
    const res = await GlobalBusinessSetupRenewal.bulkWrite(ops, { ordered: false });
    return { upserted: res.upsertedCount + res.modifiedCount };
};

// ── Reads ──────────────────────────────────────────────────────────────────

exports.hasAnyRenewal = async referenceId => {
    if (!referenceId) return false;
    const count = await GlobalBusinessSetupRenewal.countDocuments({ reference_id: referenceId }).limit(1);
    return count > 0;
};

exports.findRenewalsByFilter = async ({
    referenceId,
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort,
}) => {
    const query = { reference_id: referenceId };
    if (searchText) {
        const rx = new RegExp(escapeRegex(searchText), "i");
        query.$or = [
            { company_name:   rx },
            { renewal_type:   rx },
            { country_name:   rx },
            { application_id: rx },
        ];
    }

    const sortDirection = String(sort || "DESC").toUpperCase() === "ASC" ? 1 : -1;
    const skip = (Math.max(1, Number(page)) - 1) * Number(itemsPerPage);
    const limit = Number(itemsPerPage);

    const [rows, total] = await Promise.all([
        GlobalBusinessSetupRenewal.find(query)
            .sort({ vendor_created_at: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean(),
        GlobalBusinessSetupRenewal.countDocuments(query),
    ]);

    return {
        renewals: rows.map(toVendorShape),
        total,
    };
};

// Map cached doc → vendor-like shape so the frontend column renderers keep
// working. Listings need: renewal_type, company (name), country, due_date, _id.
const toVendorShape = doc => ({
    _id:            doc.vendor_renewal_id,
    reference_id:   doc.reference_id,
    application_id: doc.application_id,
    renewal_type:   doc.renewal_type,
    due_date:       doc.due_date,
    created_at:     doc.vendor_created_at,
    external_company: doc.company_name
        ? {
              name:     doc.company_name,
              country:  doc.country_name ? { name: doc.country_name } : undefined,
              freezone: doc.freezone,
          }
        : undefined,
});

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Admin report — all cached renewals across users with raw schema fields.
exports.findAllRenewalsForAdmin = async ({
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort,
} = {}) => {
    const query = {};
    if (searchText) {
        const rx = new RegExp(escapeRegex(searchText), "i");
        query.$or = [
            { company_name:   rx },
            { renewal_type:   rx },
            { country_name:   rx },
            { reference_id:   rx },
            { application_id: rx },
        ];
    }

    const sortDirection = String(sort || "DESC").toUpperCase() === "ASC" ? 1 : -1;
    const skip = (Math.max(1, Number(page)) - 1) * Number(itemsPerPage);
    const limit = Number(itemsPerPage);

    const [rows, total] = await Promise.all([
        GlobalBusinessSetupRenewal.find(query)
            .sort({ vendor_created_at: sortDirection })
            .skip(skip)
            .limit(limit)
            .lean(),
        GlobalBusinessSetupRenewal.countDocuments(query),
    ]);

    return { renewals: rows, total };
};
